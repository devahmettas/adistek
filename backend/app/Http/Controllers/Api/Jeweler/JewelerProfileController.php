<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateJewelerProfileRequest;
use App\Models\Restaurant;
use App\Support\JewelerPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelerProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var Restaurant $restaurant */
        $restaurant = $request->user();

        return response()->json([
            'data' => $this->formatPayload($restaurant),
        ]);
    }

    public function update(UpdateJewelerProfileRequest $request): JsonResponse
    {
        /** @var Restaurant $restaurant */
        $restaurant = $request->user();

        $restaurant->update($request->validated());

        return response()->json([
            'data' => $this->formatPayload($restaurant->fresh()),
        ]);
    }

    private function formatPayload(Restaurant $restaurant): array
    {
        return [
            'restaurant' => $restaurant,
            'membership' => [
                'service_fee' => (float) ($restaurant->service_fee ?? 0),
                'membership_end_date' => $restaurant->membership_end_date?->toDateString(),
                'membership_days_remaining' => $restaurant->membership_days_remaining,
                'membership_expired' => $restaurant->membership_expired,
            ],
            'permissions' => JewelerPermissions::ownerDefaults(),
            'is_owner' => true,
        ];
    }
}
