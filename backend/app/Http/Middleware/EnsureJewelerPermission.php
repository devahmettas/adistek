<?php

namespace App\Http\Middleware;

use App\Models\JewelerStaff;
use App\Models\Restaurant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJewelerPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if ($user instanceof Restaurant) {
            return $next($request);
        }

        if ($user instanceof JewelerStaff && $user->hasPermission($permission)) {
            return $next($request);
        }

        abort(403, 'Bu işlem için yetkiniz bulunmuyor.');
    }
}
