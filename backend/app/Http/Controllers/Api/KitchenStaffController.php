<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreKitchenStaffRequest;
use App\Http\Requests\UpdateKitchenStaffRequest;
use App\Models\KitchenStaff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenStaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $staff = KitchenStaff::query()
            ->where('restaurant_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']);

        return response()->json([
            'data' => $staff,
        ]);
    }

    public function store(StoreKitchenStaffRequest $request): JsonResponse
    {
        $staff = KitchenStaff::create([
            'restaurant_id' => $request->user()->id,
            ...$request->validated(),
        ]);

        return response()->json([
            'data' => $staff->only(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']),
        ], 201);
    }

    public function update(UpdateKitchenStaffRequest $request, KitchenStaff $kitchenStaff): JsonResponse
    {
        if ($kitchenStaff->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $data = $request->validated();

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        $kitchenStaff->update($data);

        return response()->json([
            'data' => $kitchenStaff->fresh()->only(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']),
        ]);
    }

    public function destroy(Request $request, KitchenStaff $kitchenStaff): JsonResponse
    {
        if ($kitchenStaff->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $kitchenStaff->tokens()->delete();
        $kitchenStaff->delete();

        return response()->json([
            'message' => 'Mutfak çalışanı silindi.',
        ]);
    }
}
