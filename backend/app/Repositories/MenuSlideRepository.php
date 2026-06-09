<?php

namespace App\Repositories;

use App\Models\MenuSlide;
use Illuminate\Database\Eloquent\Collection;

class MenuSlideRepository
{
    public function getByRestaurant(int $restaurantId): Collection
    {
        return MenuSlide::query()
            ->where('restaurant_id', $restaurantId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function getActiveByRestaurant(int $restaurantId): Collection
    {
        return MenuSlide::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function findForRestaurant(int $slideId, int $restaurantId): ?MenuSlide
    {
        return MenuSlide::query()
            ->where('restaurant_id', $restaurantId)
            ->whereKey($slideId)
            ->first();
    }

    public function create(array $data): MenuSlide
    {
        return MenuSlide::create($data);
    }

    public function update(MenuSlide $slide, array $data): MenuSlide
    {
        $slide->update($data);

        return $slide->fresh();
    }

    public function delete(MenuSlide $slide): void
    {
        $slide->delete();
    }
}
