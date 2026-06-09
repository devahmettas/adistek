<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMenuSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->user();

        return response()->json([
            'data' => [
                'menu_tagline' => $restaurant->menu_tagline,
                'menu_welcome_text' => $restaurant->menu_welcome_text,
            ],
        ]);
    }

    public function update(UpdateMenuSettingsRequest $request): JsonResponse
    {
        $restaurant = $request->user();
        $restaurant->update($request->validated());

        return response()->json([
            'data' => [
                'menu_tagline' => $restaurant->menu_tagline,
                'menu_welcome_text' => $restaurant->menu_welcome_text,
            ],
            'message' => 'Menü ayarları kaydedildi.',
        ]);
    }
}
