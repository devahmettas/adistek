<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KitchenLoginRequest;
use App\Models\KitchenStaff;
use App\Support\RestaurantFeatures;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class KitchenAuthController extends Controller
{
    public function login(KitchenLoginRequest $request): JsonResponse
    {
        $staff = KitchenStaff::where('email', $request->validated('email'))->first();

        if (
            ! $staff
            || ! $staff->is_active
            || ! Hash::check($request->validated('password'), $staff->password)
        ) {
            throw ValidationException::withMessages([
                'email' => ['E-posta veya şifre hatalı.'],
            ]);
        }

        $staff->load('restaurant:id,name,feature_order_tracking');

        if (! RestaurantFeatures::isEnabled($staff->restaurant, RestaurantFeatures::ORDER_TRACKING)) {
            throw ValidationException::withMessages([
                'email' => ['Bu işletme için sipariş takibi özelliği aktif değil.'],
            ]);
        }

        $token = $staff->createToken('kitchen')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'kitchen_staff' => $staff,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $staff = $request->user();
        $staff->load('restaurant:id,name');

        return response()->json([
            'data' => $staff,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Çıkış yapıldı.',
        ]);
    }
}
