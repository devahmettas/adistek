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

    public function findForRestaurant(int $categoryId, int $restaurantId): ?Category
    {
        return Category::query()
            ->where('id', $categoryId)
            ->where('restaurant_id', $restaurantId)
            ->first();
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);

        return $category->fresh();
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }

    public function productCount(Category $category): int
    {
        return $category->products()->count();
    }
}
