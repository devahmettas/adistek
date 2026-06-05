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

    public function create(array $data): Product
    {
        return Product::create($data);
    }
}
