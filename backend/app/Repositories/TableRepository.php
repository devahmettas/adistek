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
        return RestaurantTable::create($data);
    }

    public function attachProduct(RestaurantTable $table, Product $product): void
    {
        if (! $table->products()->where('product_id', $product->id)->exists()) {
            $table->products()->attach($product->id);
        }
    }
}
