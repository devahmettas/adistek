<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryMetalType;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryGoldPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelryGoldPriceController extends Controller
{
    use ResolvesRestaurantId;

    public function index(Request $request): JsonResponse
    {
        $prices = JewelryGoldPrice::query()
            ->where('restaurant_id', $this->restaurantId($request))
            ->orderByDesc('effective_at')
            ->get();

        return response()->json(['data' => $prices]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'metal_type' => ['required', Rule::in(JewelryMetalType::values())],
            'karat' => ['required', 'integer', 'min:1', 'max:24'],
            'buy_price_per_gram' => ['required', 'numeric', 'min:0'],
            'sell_price_per_gram' => ['required', 'numeric', 'min:0'],
            'source' => ['nullable', 'string', 'max:100'],
            'effective_at' => ['nullable', 'date'],
        ]);

        $price = JewelryGoldPrice::create([
            ...$data,
            'restaurant_id' => $this->restaurantId($request),
            'effective_at' => $data['effective_at'] ?? now(),
        ]);

        return response()->json(['data' => $price], 201);
    }

    public function destroy(Request $request, JewelryGoldPrice $goldPrice): JsonResponse
    {
        if ($goldPrice->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }

        $goldPrice->delete();

        return response()->json(['message' => 'Fiyat kaydı silindi.']);
    }
}
