<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWaiterRequest;
use App\Http\Requests\UpdateWaiterRequest;
use App\Models\Waiter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaiterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $waiters = Waiter::query()
            ->where('restaurant_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']);

        return response()->json([
            'data' => $waiters,
        ]);
    }

    public function store(StoreWaiterRequest $request): JsonResponse
    {
        $waiter = Waiter::create([
            'restaurant_id' => $request->user()->id,
            ...$request->validated(),
        ]);

        return response()->json([
            'data' => $waiter->only(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']),
        ], 201);
    }

    public function update(UpdateWaiterRequest $request, Waiter $waiter): JsonResponse
    {
        if ($waiter->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $data = $request->validated();

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        $waiter->update($data);

        return response()->json([
            'data' => $waiter->fresh()->only(['id', 'restaurant_id', 'name', 'email', 'is_active', 'created_at']),
        ]);
    }

    public function destroy(Request $request, Waiter $waiter): JsonResponse
    {
        if ($waiter->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $waiter->restaurant->tables()
            ->where('viewing_waiter_id', $waiter->id)
            ->update([
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
            ]);

        $waiter->tokens()->delete();
        $waiter->delete();

        return response()->json([
            'message' => 'Garson silindi.',
        ]);
    }
}
