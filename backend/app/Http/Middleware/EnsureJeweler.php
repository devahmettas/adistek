<?php

namespace App\Http\Middleware;

use App\Enums\BusinessType;
use App\Models\Restaurant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJeweler
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof Restaurant || $user->business_type !== BusinessType::Jeweler) {
            abort(403, 'Bu modül yalnızca kuyumcu işletmeleri için kullanılabilir.');
        }

        return $next($request);
    }
}
