<?php

namespace App\Http\Middleware;

use App\Models\Restaurant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRestaurant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof Restaurant) {
            abort(403, 'Bu işlem için restoran girişi gerekli.');
        }

        return $next($request);
    }
}
