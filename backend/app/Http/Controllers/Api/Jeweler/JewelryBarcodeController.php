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
            trim($barcode),
        );

        if (! $product) {
            return response()->json([
                'message' => 'Barkoda ait ürün bulunamadı.',
            ], 404);
        }

        return response()->json(['data' => $product]);
    }

    public function check(Request $request, string $barcode): JsonResponse
    {
        $normalized = trim($barcode);

        if ($normalized === '') {
            return response()->json([
                'message' => 'Barkod boş olamaz.',
            ], 422);
        }

        $product = $this->productService->findByBarcode(
            $this->restaurantId($request),
            $normalized,
        );

        return response()->json([
            'data' => [
                'barcode' => $normalized,
                'available' => $product === null,
                'product' => $product,
            ],
        ]);
    }
}
