<?php

namespace App\Services;

use App\Enums\JewelryStockMovementType;
use App\Models\JewelryProduct;
use App\Models\JewelrySetting;
use App\Models\JewelryStockMovement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelryProductService
{
    public function __construct(
        private readonly JewelryProductPriceService $priceService,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        return JewelryProduct::query()
            ->with('category')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();
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
            }

            return $product->load('category');
        });
    }

    public function update(int $restaurantId, int $id, array $data): JewelryProduct
    {
        $product = $this->findForRestaurant($restaurantId, $id);
        unset($data['stock_quantity'], $data['barcode']);

        $data = $this->applySalePrice($data, $product);

        $product->update($data);

        return $product->refresh()->load('category');
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
                JewelryStockMovementType::In, JewelryStockMovementType::Return => $quantity,
                JewelryStockMovementType::Out, JewelryStockMovementType::Sale, JewelryStockMovementType::Repair => -$quantity,
                JewelryStockMovementType::Adjustment => $quantity,
            };

            if ($type === JewelryStockMovementType::Adjustment) {
                $product->update(['stock_quantity' => max(0, $quantity)]);
            } else {
                $product->update(['stock_quantity' => max(0, $product->stock_quantity + $delta)]);
            }

            $this->recordMovement($restaurantId, $product->refresh(), $type, abs($quantity), $notes);

            return $product->load('category');
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
