<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WaiterLoginRequest;
use App\Models\Waiter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class WaiterAuthController extends Controller
{
    public function login(WaiterLoginRequest $request): JsonResponse
    {
        $waiter = Waiter::where('email', $request->validated('email'))->first();

        if (
            ! $waiter
            || ! $waiter->is_active
            || ! Hash::check($request->validated('password'), $waiter->password)
        ) {
            throw ValidationException::withMessages([
                'email' => ['E-posta veya şifre hatalı.'],
            ]);
        }

        $waiter->load('restaurant:id,name');
        $token = $waiter->createToken('waiter')->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'waiter' => $waiter,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $waiter = $request->user();
        $waiter->load('restaurant:id,name');

        return response()->json([
            'data' => $waiter,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $waiter = $request->user();

        $waiter->restaurant->tables()
            ->where('viewing_waiter_id', $waiter->id)
            ->update([
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
            ]);

        $waiter->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Çıkış yapıldı.',
        ]);
    }
}
