<?php

namespace App\Http\Controllers\Concerns;

use App\Models\KitchenStaff;
use App\Models\Restaurant;
use App\Models\Waiter;
use Illuminate\Http\Request;

trait ResolvesRestaurantId
{
    protected function restaurantId(Request $request): int
    {
        $user = $request->user();

        if ($user instanceof Restaurant) {
            return $user->id;
        }

        if ($user instanceof Waiter) {
            return $user->restaurant_id;
        }

        if ($user instanceof KitchenStaff) {
            return $user->restaurant_id;
        }

        abort(403, 'Yetkisiz erişim.');
    }

    protected function waiterId(Request $request): ?int
    {
        $user = $request->user();

        return $user instanceof Waiter ? $user->id : null;
    }
}
