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

    public function create(array $data): Restaurant
    {
        return Restaurant::create($data);
    }

    public function find(int $id): ?Restaurant
    {
        return Restaurant::find($id);
    }
}
