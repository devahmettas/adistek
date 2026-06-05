<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository
{
    public function getByRestaurant(int $restaurantId): Collection
    {
        return Product::query()
            ->with('category')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findForRestaurant(int $id, int $restaurantId): ?Product
    {
        return Product::query()
            ->with('category')
            ->where('id', $id)
            ->where('restaurant_id', $restaurantId)
            ->first();
    }

    public function create(array $data): Product
    {
        return Product::create($data)->load('category');
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);

        return $product->fresh(['category']);
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    public function find(int $id): ?Product
    {
        return Product::find($id);
    }
}
