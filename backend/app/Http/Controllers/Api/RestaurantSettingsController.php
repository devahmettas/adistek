<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateRestaurantSettingsRequest;
use App\Models\TableReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->user();

        return response()->json([
            'data' => [
                'reservation_duration_minutes' => $restaurant->reservation_duration_minutes,
                'reservation_visible_before_minutes' => $restaurant->reservation_visible_before_minutes,
            ],
        ]);
    }

    public function update(UpdateRestaurantSettingsRequest $request): JsonResponse
    {
        $restaurant = $request->user();
        $restaurant->update($request->validated());

        TableReservation::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('reserved_at', '>=', now())
            ->update(['duration_minutes' => $restaurant->reservation_duration_minutes]);

        return response()->json([
            'data' => [
                'reservation_duration_minutes' => $restaurant->reservation_duration_minutes,
                'reservation_visible_before_minutes' => $restaurant->reservation_visible_before_minutes,
            ],
            'message' => 'Ayarlar kaydedildi.',
        ]);
    }
}
