<?php

namespace App\Repositories;

use App\Models\Product;
use App\Models\RestaurantTable;
use Illuminate\Database\Eloquent\Collection;

class TableRepository
{
    public function getByRestaurant(int $restaurantId): Collection
    {
        return RestaurantTable::query()
            ->with(['products.category'])
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findForRestaurant(int $tableId, int $restaurantId): ?RestaurantTable
    {
        return RestaurantTable::query()
            ->where('id', $tableId)
            ->where('restaurant_id', $restaurantId)
            ->first();
    }

    public function create(array $data): RestaurantTable
    {
        return RestaurantTable::create($data)->load(['products.category']);
    }

    public function update(RestaurantTable $table, array $data): RestaurantTable
    {
        $table->update($data);

        return $table->fresh(['products.category']);
    }

    public function attachProduct(
        RestaurantTable $table,
        Product $product,
        int $quantity = 1,
        ?string $note = null,
    ): void {
        $existing = $table->products()->where('product_id', $product->id)->first();

        if ($existing) {
            $table->products()->updateExistingPivot($product->id, [
                'quantity' => ($existing->pivot->quantity ?? 1) + $quantity,
                'note' => $note ?? $existing->pivot->note,
            ]);

            return;
        }

        $table->products()->attach($product->id, [
            'quantity' => $quantity,
            'note' => $note,
        ]);
    }

    public function updateProductPivot(
        RestaurantTable $table,
        int $productId,
        int $quantity,
        ?string $note = null,
    ): void {
        if ($quantity <= 0) {
            $table->products()->detach($productId);

            return;
        }

        $existing = $table->products()->where('product_id', $productId)->first();

        if (! $existing) {
            return;
        }

        $table->products()->updateExistingPivot($productId, [
            'quantity' => $quantity,
            'note' => $note,
        ]);
    }

    public function detachAllProducts(RestaurantTable $table): void
    {
        $table->products()->detach();
    }
}
