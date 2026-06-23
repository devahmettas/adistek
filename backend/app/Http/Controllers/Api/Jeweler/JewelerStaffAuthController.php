<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\BusinessType;
use App\Http\Controllers\Controller;
use App\Http\Requests\JewelerStaffLoginRequest;
use App\Models\JewelerStaff;
use App\Support\JewelerPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class JewelerStaffAuthController extends Controller
{
    public function login(JewelerStaffLoginRequest $request): JsonResponse
    {
        $staff = JewelerStaff::where('email', $request->validated('email'))->first();

        if (
            ! $staff
            || ! $staff->is_active
            || ! Hash::check($request->validated('password'), $staff->password)
        ) {
            throw ValidationException::withMessages([
                'email' => ['E-posta veya şifre hatalı.'],
            ]);
        }

        $staff->load('restaurant:id,name,business_type,membership_end_date,service_fee,feature_jeweler_barcode,feature_jeweler_reports');

        if (
            ! $staff->restaurant
            || $staff->restaurant->business_type !== BusinessType::Jeweler
        ) {
            throw ValidationException::withMessages([
                'email' => ['Bu hesap kuyumcu paneline erişemez.'],
            ]);
        }

        if ($staff->restaurant->isMembershipExpired()) {
            throw ValidationException::withMessages([
                'email' => ['İşletme üyeliği sona ermiş. Lütfen işletme sahibi ile iletişime geçin.'],
            ]);
        }

        $token = $staff->createToken('jeweler-staff')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'staff' => $staff->toAuthArray(),
                'restaurant' => $staff->restaurant,
                'permissions' => $staff->permissionMap(),
                'is_owner' => false,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var JewelerStaff $staff */
        $staff = $request->user();
        $staff->load('restaurant');

        if ($staff->restaurant?->isMembershipExpired()) {
            $staff->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'İşletme üyeliği sona ermiş.',
            ], 403);
        }

        return response()->json([
            'data' => [
                'staff' => $staff->toAuthArray(),
                'restaurant' => $staff->restaurant,
                'permissions' => $staff->permissionMap(),
                'is_owner' => false,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Çıkış yapıldı.',
        ]);
    }

    public function permissionsCatalog(): JsonResponse
    {
        return response()->json([
            'data' => [
                'permissions' => collect(JewelerPermissions::labels())
                    ->map(fn (string $label, string $key) => [
                        'key' => $key,
                        'label' => $label,
                        'default' => JewelerPermissions::defaultsForNewStaff()[$key] ?? false,
                    ])
                    ->values(),
            ],
        ]);
    }
}
