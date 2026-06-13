<?php

namespace App\Services;

use App\Models\JewelryInventoryLot;
use App\Models\JewelryProduct;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class JewelryInventoryCostService
{
    /**
     * @return array{
     *     fifo_unit_cost: float,
     *     fifo_line_cost: float,
     *     average_unit_cost: float,
     *     labor_cost: float,
     *     unit_cost_with_labor: float,
     * }
     */
    public function previewSaleCost(JewelryProduct $product, int $quantity): array
    {
        $quantity = max(1, $quantity);
        $fifo = $this->calculateFifoAllocation($product, $quantity);
        $laborCost = (float) $product->labor_cost;
        $unitCostWithLabor = round($fifo['fifo_unit_cost'] + $laborCost, 2);

        return [
            'fifo_unit_cost' => $fifo['fifo_unit_cost'],
            'fifo_line_cost' => round($fifo['fifo_line_cost'] + ($laborCost * $quantity), 2),
            'average_unit_cost' => $this->getWeightedAverageUnitCost($product),
            'labor_cost' => $laborCost,
            'unit_cost_with_labor' => $unitCostWithLabor,
        ];
    }

    /**
     * @return array{
     *     fifo_unit_cost: float,
     *     fifo_line_cost: float,
     *     unit_cost_with_labor: float,
     *     line_cost_with_labor: float,
     * }
     */
    public function allocateSaleCost(JewelryProduct $product, int $quantity): array
    {
        return DB::transaction(function () use ($product, $quantity) {
            $quantity = max(1, $quantity);
            $lockedProduct = JewelryProduct::query()
                ->whereKey($product->id)
                ->lockForUpdate()
                ->firstOrFail();

            $fifo = $this->calculateFifoAllocation($lockedProduct, $quantity, true);
            $laborCost = (float) $lockedProduct->labor_cost;
            $unitCostWithLabor = round($fifo['fifo_unit_cost'] + $laborCost, 2);
            $lineCostWithLabor = round($fifo['fifo_line_cost'] + ($laborCost * $quantity), 2);

            $this->syncProductAveragePurchasePrice($lockedProduct->fresh());

            return [
                'fifo_unit_cost' => $fifo['fifo_unit_cost'],
                'fifo_line_cost' => $fifo['fifo_line_cost'],
                'unit_cost_with_labor' => $unitCostWithLabor,
                'line_cost_with_labor' => $lineCostWithLabor,
            ];
        });
    }

    public function addLot(
        JewelryProduct $product,
        int $quantity,
        float $unitCost,
        ?int $purchaseItemId = null,
        ?Carbon $purchasedAt = null,
    ): JewelryInventoryLot {
        $quantity = max(1, $quantity);
        $unitCost = round(max(0, $unitCost), 2);

        $lot = JewelryInventoryLot::create([
            'product_id' => $product->id,
            'purchase_item_id' => $purchaseItemId,
            'quantity_initial' => $quantity,
            'quantity_remaining' => $quantity,
            'unit_cost' => $unitCost,
            'purchased_at' => $purchasedAt ?? now(),
        ]);

        $this->syncProductAveragePurchasePrice($product->fresh());

        return $lot;
    }

    public function getWeightedAverageUnitCost(JewelryProduct $product): float
    {
        $lots = $this->availableLots($product->id);

        $totalQuantity = $lots->sum('quantity_remaining');
        if ($totalQuantity <= 0) {
            return round((float) $product->purchase_price, 2);
        }

        $totalCost = $lots->sum(
            fn (JewelryInventoryLot $lot) => $lot->quantity_remaining * (float) $lot->unit_cost,
        );

        return round($totalCost / $totalQuantity, 2);
    }

    public function syncProductAveragePurchasePrice(JewelryProduct $product): void
    {
        $average = $this->getWeightedAverageUnitCost($product);
        $product->update(['purchase_price' => $average]);
    }

    /**
     * @return array{fifo_unit_cost: float, fifo_line_cost: float}
     */
    private function calculateFifoAllocation(
        JewelryProduct $product,
        int $quantity,
        bool $mutate = false,
    ): array {
        $lots = $this->availableLots($product->id, $mutate);
        $remaining = $quantity;
        $totalCost = 0.0;

        foreach ($lots as $lot) {
            if ($remaining <= 0) {
                break;
            }

            $take = min($remaining, $lot->quantity_remaining);
            $totalCost += $take * (float) $lot->unit_cost;

            if ($mutate) {
                $lot->update([
                    'quantity_remaining' => $lot->quantity_remaining - $take,
                ]);
            }

            $remaining -= $take;
        }

        if ($remaining > 0) {
            $fallback = round((float) $product->purchase_price, 2);
            $totalCost += $remaining * $fallback;
        }

        $lineCost = round($totalCost, 2);
        $unitCost = $quantity > 0 ? round($lineCost / $quantity, 2) : 0.0;

        return [
            'fifo_unit_cost' => $unitCost,
            'fifo_line_cost' => $lineCost,
        ];
    }

    private function availableLots(int $productId, bool $lock = false): Collection
    {
        $query = JewelryInventoryLot::query()
            ->where('product_id', $productId)
            ->where('quantity_remaining', '>', 0)
            ->orderBy('purchased_at')
            ->orderBy('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->get();
    }
}
