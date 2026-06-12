<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelrySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelrySettingController extends Controller
{
    use ResolvesRestaurantId;

    public function show(Request $request): JsonResponse
    {
        $settings = JewelrySetting::firstOrCreate(
            ['restaurant_id' => $this->restaurantId($request)],
            ['default_karat' => 22],
        );

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'default_karat' => ['sometimes', 'integer', 'min:1', 'max:24'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'currency' => ['nullable', 'string', 'size:3'],
            'barcode_prefix' => ['nullable', 'string', 'max:10'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'receipt_footer' => ['nullable', 'string', 'max:255'],
            'auto_generate_barcode' => ['boolean'],
        ]);

        $settings = JewelrySetting::firstOrCreate(
            ['restaurant_id' => $this->restaurantId($request)],
            ['default_karat' => 22],
        );

        $settings->update($data);

        return response()->json(['data' => $settings->refresh()]);
    }
}
