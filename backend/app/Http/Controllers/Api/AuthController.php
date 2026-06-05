<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRestaurantRequest;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRestaurantRequest $request): JsonResponse
    {
        $restaurant = Restaurant::create($request->validated());
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
        return response()->json([
            'data' => $request->user(),
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
