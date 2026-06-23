<?php

namespace App\Http\Middleware;

use App\Enums\BusinessType;
use App\Models\JewelerStaff;
use App\Models\Restaurant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureJewelerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof Restaurant) {
            if ($user->business_type !== BusinessType::Jeweler) {
                abort(403, 'Bu modül yalnızca kuyumcu işletmeleri için kullanılabilir.');
            }

            if ($user->isMembershipExpired()) {
                abort(403, 'Üyelik süreniz dolmuştur. Lütfen hizmet bedelini ödeyerek üyeliğinizi yenileyin.');
            }

            return $next($request);
        }

        if ($user instanceof JewelerStaff) {
            if (! $user->is_active) {
                abort(403, 'Hesabınız pasif durumda.');
            }

            $user->loadMissing('restaurant');

            if (
                ! $user->restaurant
                || $user->restaurant->business_type !== BusinessType::Jeweler
                || $user->restaurant->isMembershipExpired()
            ) {
                abort(403, 'İşletme üyeliği geçersiz veya süresi dolmuş.');
            }

            return $next($request);
        }

        abort(403, 'Bu işlem için kuyumcu girişi gerekli.');
    }
}
