<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Services\JewelryProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryBarcodeController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryProductService $productService,
    ) {}

    public function lookup(Request $request, string $barcode): JsonResponse
    {
        $product = $this->productService->findByBarcode(
            $this->restaurantId($request),
            $barcode,
        );

        if (! $product) {
            return response()->json([
                'message' => 'Barkoda ait ürün bulunamadı.',
            ], 404);
        }

        return response()->json(['data' => $product]);
    }
}
