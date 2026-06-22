<?php

namespace App\Services;

use App\Enums\JewelryStockMovementType;
use App\Models\JewelryProduct;
use App\Models\JewelrySetting;
use App\Models\JewelryStockMovement;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class JewelryProductService
{
    public function __construct(
        private readonly JewelryProductPriceService $priceService,
        private readonly JewelryInventoryCostService $inventoryCostService,
    ) {}

    public function listByRestaurant(int $restaurantId): EloquentCollection
    {
        $products = JewelryProduct::query()
            ->with('category')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();

        return $this->enrichWithCostMetrics($products);
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelryProduct
    {
        $product = JewelryProduct::query()
            ->with('category')
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $product) {
            throw new NotFoundHttpException('Ürün bulunamadı.');
        }

        return $product;
    }

    public function findForRestaurantWithMetrics(int $restaurantId, int $id): JewelryProduct
    {
        $product = $this->findForRestaurant($restaurantId, $id)->load('category');

        return $this->enrichWithCostMetrics(collect([$product]))->first();
    }

    public function findByBarcode(int $restaurantId, string $barcode): ?JewelryProduct
    {
        return JewelryProduct::query()
            ->with('category')
            ->where('restaurant_id', $restaurantId)
            ->where('barcode', $barcode)
            ->first();
    }

    public function create(int $restaurantId, array $data): JewelryProduct
    {
        return DB::transaction(function () use ($restaurantId, $data) {
            if (! empty($data['barcode'])) {
                $data['barcode'] = trim((string) $data['barcode']);

                if ($data['barcode'] === '') {
                    unset($data['barcode']);
                } elseif ($this->findByBarcode($restaurantId, $data['barcode'])) {
                    throw new UnprocessableEntityHttpException('Bu barkod zaten sisteme kayıtlı.');
                }
            }

            if (empty($data['barcode'])) {
                $data['barcode'] = $this->generateBarcode($restaurantId);
            }

            $initialStock = (int) ($data['stock_quantity'] ?? 0);
            unset($data['stock_quantity']);

            $data = $this->applySalePrice($data);

            $product = JewelryProduct::create([
                ...$data,
                'restaurant_id' => $restaurantId,
                'stock_quantity' => $initialStock,
            ]);

            if ($initialStock > 0) {
                $this->recordMovement(
                    $restaurantId,
                    $product,
                    JewelryStockMovementType::In,
                    $initialStock,
                    'İlk stok girişi',
                );

                $this->inventoryCostService->addLot(
                    $product,
                    $initialStock,
                    (float) ($data['purchase_price'] ?? 0),
                );
            }

            return $this->enrichWithCostMetrics(collect([$product->load('category')]))->first();
        });
    }

    public function update(int $restaurantId, int $id, array $data): JewelryProduct
    {
        $product = $this->findForRestaurant($restaurantId, $id);
        unset($data['barcode']);

        $newStock = null;
        if (array_key_exists('stock_quantity', $data)) {
            $newStock = max(0, (int) $data['stock_quantity']);
            unset($data['stock_quantity']);
        }

        $data = $this->applySalePrice($data, $product);
        $product->update($data);

        if ($newStock !== null && $newStock !== $product->stock_quantity) {
            $this->adjustStock(
                $restaurantId,
                $product->id,
                $newStock,
                JewelryStockMovementType::Adjustment,
                'Ürün düzenleme ile stok güncellemesi',
            );
        }

        return $this->enrichWithCostMetrics(collect([$product->refresh()->load('category')]))->first();
    }

    public function previewSaleCost(int $restaurantId, int $productId, int $quantity): array
    {
        $product = $this->findForRestaurant($restaurantId, $productId);

        return $this->inventoryCostService->previewSaleCost($product, $quantity);
    }

    /**
     * @param  Collection<int, JewelryProduct>|EloquentCollection<int, JewelryProduct>  $products
     * @return Collection<int, JewelryProduct>|EloquentCollection<int, JewelryProduct>
     */
    public function enrichWithCostMetrics(Collection|EloquentCollection $products): Collection|EloquentCollection
    {
        return $products->map(function (JewelryProduct $product) {
            $preview = $this->inventoryCostService->previewSaleCost($product, 1);

            $product->setAttribute('average_unit_cost', $preview['average_unit_cost']);
            $product->setAttribute('fifo_unit_cost', $preview['unit_cost_with_labor']);
            $product->setAttribute('average_unit_cost_with_labor', round(
                $preview['average_unit_cost'] + (float) $product->labor_cost,
                2,
            ));

            return $product;
        });
    }

    public function delete(int $restaurantId, int $id): void
    {
        $product = $this->findForRestaurant($restaurantId, $id);
        $product->delete();
    }

    public function adjustStock(
        int $restaurantId,
        int $productId,
        int $quantity,
        JewelryStockMovementType $type,
        ?string $notes = null,
    ): JewelryProduct {
        return DB::transaction(function () use ($restaurantId, $productId, $quantity, $type, $notes) {
            $product = $this->findForRestaurant($restaurantId, $productId);

            $delta = match ($type) {
                JewelryStockMovementType::In, JewelryStockMovementType::Return, JewelryStockMovementType::Purchase => $quantity,
                JewelryStockMovementType::Out, JewelryStockMovementType::Sale, JewelryStockMovementType::Repair => -$quantity,
                JewelryStockMovementType::Adjustment => $quantity,
            };

            if ($type === JewelryStockMovementType::Adjustment) {
                $product->update(['stock_quantity' => max(0, $quantity)]);
            } else {
                $product->update(['stock_quantity' => max(0, $product->stock_quantity + $delta)]);
            }

            $this->recordMovement($restaurantId, $product->refresh(), $type, abs($quantity), $notes);

            if ($type === JewelryStockMovementType::In) {
                $this->inventoryCostService->addLot(
                    $product->refresh(),
                    $quantity,
                    (float) $product->purchase_price,
                );
            }

            return $this->enrichWithCostMetrics(collect([$product->load('category')]))->first();
        });
    }

    private function recordMovement(
        int $restaurantId,
        JewelryProduct $product,
        JewelryStockMovementType $type,
        int $quantity,
        ?string $notes,
    ): void {
        JewelryStockMovement::create([
            'restaurant_id' => $restaurantId,
            'product_id' => $product->id,
            'type' => $type,
            'quantity' => $quantity,
            'weight_gram' => $product->weight_gram,
            'notes' => $notes,
        ]);
    }

    private function generateBarcode(int $restaurantId): string
    {
        $settings = JewelrySetting::firstOrCreate(
            ['restaurant_id' => $restaurantId],
            ['default_karat' => 22],
        );

        $prefix = $settings->barcode_prefix ?? 'KYM';
        $sequence = JewelryProduct::where('restaurant_id', $restaurantId)->count() + 1;

        return sprintf('%s%06d', strtoupper($prefix), $sequence);
    }

    private function applySalePrice(array $data, ?JewelryProduct $existing = null): array
    {
        $isManual = (bool) ($data['is_manual_price'] ?? $existing?->is_manual_price ?? false);

        if ($isManual) {
            return $data;
        }

        $weightGram = (float) ($data['weight_gram'] ?? $existing?->weight_gram ?? 0);
        $karat = (int) ($data['karat'] ?? $existing?->karat ?? 22);
        $laborCost = (float) ($data['labor_cost'] ?? $existing?->labor_cost ?? 0);
        $profitRate = (float) ($data['profit_rate'] ?? $existing?->profit_rate ?? 0);

        $calculation = $this->priceService->calculate($weightGram, $karat, $laborCost, $profitRate);

        if ($calculation !== null) {
            $data['sale_price'] = $calculation['sale_price'];
        }

        return $data;
    }
}
