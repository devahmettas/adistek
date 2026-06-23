<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreJewelerStaffRequest;
use App\Http\Requests\UpdateJewelerStaffRequest;
use App\Models\JewelerStaff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelerStaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $staff = JewelerStaff::query()
            ->where('restaurant_id', $request->user()->id)
            ->orderBy('name')
            ->get()
            ->map(fn (JewelerStaff $member) => $member->toAuthArray());

        return response()->json(['data' => $staff]);
    }

    public function store(StoreJewelerStaffRequest $request): JsonResponse
    {
        $staff = JewelerStaff::create([
            'restaurant_id' => $request->user()->id,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
            'permissions' => $request->validatedPermissions(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'data' => $staff->toAuthArray(),
        ], 201);
    }

    public function update(UpdateJewelerStaffRequest $request, JewelerStaff $jewelerStaff): JsonResponse
    {
        if ($jewelerStaff->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $data = $request->validated();

        if (array_key_exists('password', $data) && blank($data['password'])) {
            unset($data['password']);
        }

        if ($request->has('permissions')) {
            $data['permissions'] = $request->validatedPermissions($jewelerStaff->permissions);
        }

        $jewelerStaff->update($data);

        if (array_key_exists('is_active', $data) && ! $jewelerStaff->is_active) {
            $jewelerStaff->tokens()->delete();
        }

        return response()->json([
            'data' => $jewelerStaff->fresh()->toAuthArray(),
        ]);
    }

    public function destroy(Request $request, JewelerStaff $jewelerStaff): JsonResponse
    {
        if ($jewelerStaff->restaurant_id !== $request->user()->id) {
            abort(404);
        }

        $jewelerStaff->tokens()->delete();
        $jewelerStaff->delete();

        return response()->json([
            'message' => 'Personel silindi.',
        ]);
    }
}
