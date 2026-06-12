<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryStockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryStockController extends Controller
{
    use ResolvesRestaurantId;

    public function index(Request $request): JsonResponse
    {
        $movements = JewelryStockMovement::query()
            ->with('product')
            ->where('restaurant_id', $this->restaurantId($request))
            ->orderByDesc('created_at')
            ->limit(200)
            ->get();

        return response()->json(['data' => $movements]);
    }
}
