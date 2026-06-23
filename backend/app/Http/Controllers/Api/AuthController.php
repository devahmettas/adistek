<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRestaurantRequest;
use App\Models\Restaurant;
use App\Support\RestaurantSlugGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRestaurantRequest $request): JsonResponse
    {
        $restaurant = Restaurant::create([
            ...$request->validated(),
            'slug' => RestaurantSlugGenerator::generate($request->validated('name')),
        ]);
        $token = $restaurant->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'restaurant' => $restaurant,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $restaurant = Restaurant::where('email', $request->validated('email'))->first();

        if (! $restaurant || ! Hash::check($request->validated('password'), $restaurant->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-posta veya şifre hatalı.'],
            ]);
        }

        if ($restaurant->isMembershipExpired()) {
            throw ValidationException::withMessages([
                'email' => ['Üyelik süreniz dolmuştur. Lütfen hizmet bedelini ödeyerek üyeliğinizi yenileyin.'],
            ]);
        }

        $token = $restaurant->createToken('auth')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'restaurant' => $restaurant,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        if (! $request->user() instanceof Restaurant) {
            abort(403, 'Bu oturum restoran sahibi hesabına ait değil.');
        }

        /** @var Restaurant $restaurant */
        $restaurant = $request->user();

        if ($restaurant->isMembershipExpired()) {
            $restaurant->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Üyelik süreniz dolmuştur. Lütfen hizmet bedelini ödeyerek üyeliğinizi yenileyin.',
            ], 403);
        }

        return response()->json([
            'data' => $restaurant,
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
