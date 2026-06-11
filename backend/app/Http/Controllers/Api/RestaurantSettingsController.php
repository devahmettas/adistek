<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRestaurantSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->user();

        return response()->json([
            'data' => $this->formatSettings($restaurant),
        ]);
    }

    public function update(UpdateRestaurantSettingsRequest $request): JsonResponse
    {
        $restaurant = $request->user();
        $restaurant->update($request->validated());

        return response()->json([
            'data' => $this->formatSettings($restaurant->fresh()),
            'message' => 'Ayarlar kaydedildi.',
        ]);
    }

    private function formatSettings($restaurant): array
    {
        return [
            'reservation_duration_minutes' => $restaurant->reservation_duration_minutes,
            'reservation_visible_before_minutes' => $restaurant->reservation_visible_before_minutes,
            'reservation_start_time' => $restaurant->reservation_start_time ?? '10:00',
            'reservation_end_time' => $restaurant->reservation_end_time ?? '23:00',
        ];
    }
}
