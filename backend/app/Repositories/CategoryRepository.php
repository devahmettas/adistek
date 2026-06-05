<?php

namespace App\Repositories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryRepository
{
    public function getByRestaurant(int $restaurantId): Collection
    {
        return Category::query()
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function find(int $id): ?Category
    {
        return Category::find($id);
    }
}
