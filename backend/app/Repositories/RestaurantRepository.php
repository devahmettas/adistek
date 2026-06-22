<?php

namespace App\Repositories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Schema;

class RestaurantRepository
{
    public function all(): Collection
    {
        return Restaurant::query()
            ->orderByDesc('created_at')
            ->get();
    }

    public function allWithStats(): Collection
    {
        $query = Restaurant::query();
        $this->applyStatsCounts($query);

        return $query
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $data): Restaurant
    {
        return Restaurant::create($data);
    }

    public function find(int $id): ?Restaurant
    {
        return Restaurant::find($id);
    }

    public function findWithStats(int $id): ?Restaurant
    {
        $query = Restaurant::query();
        $this->applyStatsCounts($query);

        return $query->find($id);
    }

    public function update(Restaurant $restaurant, array $data): Restaurant
    {
        $restaurant->update($data);

        return $restaurant->refresh();
    }

    public function delete(Restaurant $restaurant): void
    {
        $restaurant->tokens()->delete();
        $restaurant->delete();
    }

    private function applyStatsCounts(Builder $query): void
    {
        $relations = ['categories', 'products', 'tables'];

        $optionalRelations = [
            'jewelryCategories' => 'jewelry_categories',
            'jewelryProducts' => 'jewelry_products',
            'jewelryCustomers' => 'jewelry_customers',
            'jewelrySales' => 'jewelry_sales',
            'jewelryRepairs' => 'jewelry_repairs',
        ];

        foreach ($optionalRelations as $relation => $table) {
            if (Schema::hasTable($table)) {
                $relations[] = $relation;
            }
        }

        $query->withCount($relations);
    }
}
