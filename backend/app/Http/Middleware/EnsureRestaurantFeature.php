<?php

namespace App\Http\Middleware;

use App\Models\KitchenStaff;
use App\Models\Restaurant;
use App\Models\Waiter;
use App\Support\RestaurantFeatures;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRestaurantFeature
{
    public function handle(Request $request, Closure $next, string $features): Response
    {
        $restaurant = $this->resolveRestaurant($request);

        if (! $restaurant) {
            abort(403, 'Bu işlem için yetkiniz yok.');
        }

        $featureList = explode('|', $features);

        if (! RestaurantFeatures::isAnyEnabled($restaurant, $featureList)) {
            abort(403, 'Bu özellik işletmeniz için aktif değil.');
        }

        return $next($request);
    }

    private function resolveRestaurant(Request $request): ?Restaurant
    {
        $user = $request->user();

        if ($user instanceof Restaurant) {
            return $user;
        }

        if ($user instanceof Waiter || $user instanceof KitchenStaff) {
            return $user->restaurant;
        }

        return null;
    }
}
