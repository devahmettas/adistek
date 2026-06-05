<?php

namespace App\Http\Middleware;

use App\Models\Waiter;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWaiter
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof Waiter) {
            abort(403, 'Bu işlem için garson girişi gerekli.');
        }

        return $next($request);
    }
}
