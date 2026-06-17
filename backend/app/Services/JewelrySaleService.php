<?php

namespace App\Services;

use App\Enums\JewelryStockMovementType;
use App\Models\JewelrySale;
use App\Models\JewelrySaleItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelrySaleService
{
    public function __construct(
        private readonly JewelryProductService $productService,
        private readonly JewelryCashService $cashService,
        private readonly JewelryInventoryCostService $inventoryCostService,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        return JewelrySale::query()
            ->with(['customer', 'items.product.category'])
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('sold_at')
            ->get();
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelrySale
    {
        $sale = JewelrySale::query()
            ->with(['customer', 'items.product'])
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $sale) {
            throw new NotFoundHttpException('Satış bulunamadı.');
        }

        return $sale;
    }

    public function create(int $restaurantId, array $data): JewelrySale
    {
        return DB::transaction(function () use ($restaurantId, $data) {
            $items = $data['items'];
            unset($data['items']);

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += (float) $item['line_total'];
            }

            $discount = (float) ($data['discount'] ?? 0);
            $total = max(0, $subtotal - $discount);

            $sale = JewelrySale::create([
                ...$data,
                'restaurant_id' => $restaurantId,
                'sale_number' => $this->generateSaleNumber($restaurantId),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'sold_at' => $data['sold_at'] ?? now(),
            ]);

            foreach ($items as $item) {
                $unitCost = 0.0;
                $lineCost = 0.0;
                $product = null;

                if (! empty($item['product_id'])) {
                    $product = $this->productService->findForRestaurant(
                        $restaurantId,
                        (int) $item['product_id'],
                    );
                    $allocated = $this->inventoryCostService->allocateSaleCost(
                        $product,
                        (int) $item['quantity'],
                    );
                    $unitCost = $allocated['unit_cost_with_labor'];
                    $lineCost = $allocated['line_cost_with_labor'];
                }

                JewelrySaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'unit_cost' => $unitCost,
                    'line_cost' => $lineCost,
                    'weight_gram' => $item['weight_gram'] ?? null,
                    'labor_cost' => $item['labor_cost'] ?? 0,
                    'line_total' => $item['line_total'],
                ]);

                if ($product !== null) {
                    $this->productService->adjustStock(
                        $restaurantId,
                        $product->id,
                        (int) $item['quantity'],
                        JewelryStockMovementType::Sale,
                        "Satış #{$sale->sale_number}",
                    );
                }
            }

            $this->cashService->recordSale($restaurantId, $sale);

            return $sale->load(['customer', 'items.product']);
        });
    }

    public function update(int $restaurantId, int $id, array $data): JewelrySale
    {
        return DB::transaction(function () use ($restaurantId, $id, $data) {
            $sale = $this->findForRestaurant($restaurantId, $id);
            $items = $data['items'] ?? null;
            unset($data['items']);

            if ($items !== null) {
                foreach ($sale->items as $oldItem) {
                    if (! $oldItem->product_id) {
                        continue;
                    }

                    $product = $this->productService->findForRestaurant(
                        $restaurantId,
                        (int) $oldItem->product_id,
                    );

                    $this->productService->adjustStock(
                        $restaurantId,
                        $product->id,
                        (int) $oldItem->quantity,
                        JewelryStockMovementType::Return,
                        "Satış düzenleme geri alma #{$sale->sale_number}",
                    );

                    $laborCost = (float) ($oldItem->labor_cost ?? $product->labor_cost);
                    $fifoUnitCost = max(0, round((float) $oldItem->unit_cost - $laborCost, 2));
                    if ($fifoUnitCost <= 0) {
                        $fifoUnitCost = max(0, round((float) $product->purchase_price, 2));
                    }

                    $this->inventoryCostService->addLot(
                        $product,
                        (int) $oldItem->quantity,
                        $fifoUnitCost,
                        null,
                        $sale->sold_at,
                    );
                }

                $sale->items()->delete();

                $subtotal = 0.0;
                foreach ($items as $item) {
                    $subtotal += (float) $item['line_total'];

                    $unitCost = 0.0;
                    $lineCost = 0.0;
                    $product = null;

                    if (! empty($item['product_id'])) {
                        $product = $this->productService->findForRestaurant(
                            $restaurantId,
                            (int) $item['product_id'],
                        );
                        $allocated = $this->inventoryCostService->allocateSaleCost(
                            $product,
                            (int) $item['quantity'],
                        );
                        $unitCost = $allocated['unit_cost_with_labor'];
                        $lineCost = $allocated['line_cost_with_labor'];
                    }

                    JewelrySaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $item['product_id'] ?? null,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'unit_cost' => $unitCost,
                        'line_cost' => $lineCost,
                        'weight_gram' => $item['weight_gram'] ?? null,
                        'labor_cost' => $item['labor_cost'] ?? 0,
                        'line_total' => $item['line_total'],
                    ]);

                    if ($product !== null) {
                        $this->productService->adjustStock(
                            $restaurantId,
                            $product->id,
                            (int) $item['quantity'],
                            JewelryStockMovementType::Sale,
                            "Satış düzenleme #{$sale->sale_number}",
                        );
                    }
                }

                $discount = (float) ($data['discount'] ?? $sale->discount);
                $data['subtotal'] = $subtotal;
                $data['discount'] = $discount;
                $data['total'] = max(0, $subtotal - $discount);
            }

            $sale->update($data);
            $sale = $sale->fresh(['items', 'customer']);

            $this->cashService->syncSaleCash($restaurantId, $sale);

            return $sale->load(['customer', 'items.product']);
        });
    }

    private function generateSaleNumber(int $restaurantId): string
    {
        $count = JewelrySale::where('restaurant_id', $restaurantId)->count() + 1;

        return sprintf('S%06d', $count);
    }
}
