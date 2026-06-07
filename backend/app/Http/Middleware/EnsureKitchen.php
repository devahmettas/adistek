<?php

namespace App\Http\Middleware;

use App\Models\KitchenStaff;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKitchen
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof KitchenStaff) {
            abort(403, 'Bu işlem için mutfak girişi gerekli.');
        }

        return $next($request);
    }
}
