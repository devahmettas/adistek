<?php

namespace App\Http\Middleware;

use App\Models\Restaurant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJewelerOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() instanceof Restaurant) {
            abort(403, 'Bu işlem yalnızca işletme sahibi tarafından yapılabilir.');
        }

        return $next($request);
    }
}
