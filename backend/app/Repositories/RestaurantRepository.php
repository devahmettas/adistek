<?php

namespace App\Repositories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;

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
        return Restaurant::query()
            ->withCount([
                'categories',
                'products',
                'tables',
                'jewelryCategories',
                'jewelryProducts',
                'jewelryCustomers',
                'jewelrySales',
                'jewelryRepairs',
            ])
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
        return Restaurant::query()
            ->withCount([
                'categories',
                'products',
                'tables',
                'jewelryCategories',
                'jewelryProducts',
                'jewelryCustomers',
                'jewelrySales',
                'jewelryRepairs',
            ])
            ->find($id);
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
}
