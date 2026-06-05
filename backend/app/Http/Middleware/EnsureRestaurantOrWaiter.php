<?php

namespace App\Http\Middleware;

use App\Models\Restaurant;
use App\Models\Waiter;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRestaurantOrWaiter
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Restaurant && ! $user instanceof Waiter) {
            abort(403, 'Bu işlem için restoran veya garson girişi gerekli.');
        }

        if ($user instanceof Waiter && ! $user->is_active) {
            abort(403, 'Garson hesabı pasif.');
        }

        return $next($request);
    }
}
