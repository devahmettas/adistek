<?php

namespace App\Services;

use App\Models\JewelryCategory;
use App\Models\JewelryProduct;
use Illuminate\Support\Collection;

class JewelryVaultService
{
    public function __construct(
        private readonly JewelryCashService $cashService,
    ) {}

    public function getOverview(int $restaurantId): array
    {
        $categories = JewelryCategory::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $products = JewelryProduct::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->whereNotNull('category_id')
            ->orderBy('name')
            ->get()
            ->groupBy('category_id');

        $categoryRows = [];

        foreach ($categories as $category) {
            /** @var Collection<int, JewelryProduct> $categoryProducts */
            $categoryProducts = $products->get($category->id, collect());

            if ($categoryProducts->isEmpty()) {
                continue;
            }

            $categoryRows[] = $this->formatCategoryOverview($category, $categoryProducts);
        }

        usort($categoryRows, fn ($left, $right) => $right['total_value'] <=> $left['total_value']);

        $stockTotal = round(array_sum(array_column($categoryRows, 'total_value')), 2);
        $totalStockUnits = (int) array_sum(array_column($categoryRows, 'stock_units'));
        $totalGram = round(array_sum(array_column($categoryRows, 'total_gram')), 3);
        $cashSummary = $this->cashService->getSummary($restaurantId);
        $cashTransactions = $this->cashService
            ->listRecent($restaurantId)
            ->map(fn ($transaction) => $this->cashService->formatTransaction($transaction))
            ->all();

        return [
            'stock_total' => $stockTotal,
            'grand_total' => round($stockTotal + $cashSummary['balance'], 2),
            'total_stock_units' => $totalStockUnits,
            'total_gram' => $totalGram,
            'category_count' => count($categoryRows),
            'categories' => array_values($categoryRows),
            'cash' => $cashSummary,
            'cash_transactions' => $cashTransactions,
            'synced_at' => now()->toIso8601String(),
        ];
    }

    private function formatCategoryOverview(JewelryCategory $category, Collection $products): array
    {
        $stockUnits = (int) $products->sum('stock_quantity');
        $totalValue = (float) $products->sum(
            fn (JewelryProduct $product) => (float) $product->sale_price * (int) $product->stock_quantity,
        );
        $totalGram = (float) $products->sum(
            fn (JewelryProduct $product) => (float) $product->weight_gram * (int) $product->stock_quantity,
        );

        return [
            'category_id' => $category->id,
            'category_name' => $category->name,
            'product_count' => $products->count(),
            'stock_units' => $stockUnits,
            'total_gram' => round($totalGram, 3),
            'total_value' => round($totalValue, 2),
            'average_unit_value' => $stockUnits > 0 ? round($totalValue / $stockUnits, 2) : 0.0,
            'products' => $products
                ->sortByDesc(fn (JewelryProduct $product) => (float) $product->sale_price * (int) $product->stock_quantity)
                ->values()
                ->map(fn (JewelryProduct $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'stock_quantity' => (int) $product->stock_quantity,
                    'weight_gram' => (string) $product->weight_gram,
                    'karat' => $product->karat,
                    'sale_price' => (string) $product->sale_price,
                    'line_value' => round((float) $product->sale_price * (int) $product->stock_quantity, 2),
                ])
                ->all(),
        ];
    }
}
