<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryMetalType;
use App\Enums\JewelryStockMovementType;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryProduct;
use App\Services\JewelryProductPriceService;
use App\Services\JewelryProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelryProductController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryProductService $service,
        private readonly JewelryProductPriceService $priceService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listByRestaurant($this->restaurantId($request)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateProduct($request);

        $product = $this->service->create($this->restaurantId($request), $data);

        return response()->json(['data' => $product], 201);
    }

    public function show(Request $request, JewelryProduct $product): JsonResponse
    {
        $this->ensureOwnership($request, $product);

        return response()->json([
            'data' => $this->service->findForRestaurantWithMetrics($this->restaurantId($request), $product->id),
        ]);
    }

    public function saleCost(Request $request, JewelryProduct $product): JsonResponse
    {
        $this->ensureOwnership($request, $product);

        $data = $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json([
            'data' => $this->service->previewSaleCost(
                $this->restaurantId($request),
                $product->id,
                (int) ($data['quantity'] ?? 1),
            ),
        ]);
    }

    public function update(Request $request, JewelryProduct $product): JsonResponse
    {
        $this->ensureOwnership($request, $product);
        $data = $this->validateProduct($request, true);

        return response()->json([
            'data' => $this->service->update($this->restaurantId($request), $product->id, $data),
        ]);
    }

    public function destroy(Request $request, JewelryProduct $product): JsonResponse
    {
        $this->ensureOwnership($request, $product);
        $this->service->delete($this->restaurantId($request), $product->id);

        return response()->json(['message' => 'Ürün silindi.']);
    }

    public function adjustStock(Request $request, JewelryProduct $product): JsonResponse
    {
        $this->ensureOwnership($request, $product);

        $data = $request->validate([
            'type' => ['required', Rule::in(JewelryStockMovementType::values())],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = $this->service->adjustStock(
            $this->restaurantId($request),
            $product->id,
            $data['quantity'],
            JewelryStockMovementType::from($data['type']),
            $data['notes'] ?? null,
        );

        return response()->json(['data' => $updated]);
    }

    public function calculatePrice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'weight_gram' => ['required', 'numeric', 'min:0'],
            'karat' => ['required', 'integer', 'min:1', 'max:24'],
            'labor_cost' => ['nullable', 'numeric', 'min:0'],
            'profit_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $calculation = $this->priceService->calculate(
            (float) $data['weight_gram'],
            (int) $data['karat'],
            (float) ($data['labor_cost'] ?? 0),
            (float) ($data['profit_rate'] ?? 0),
        );

        if ($calculation === null) {
            return response()->json([
                'message' => 'Güncel altın fiyatı bulunamadı.',
            ], 422);
        }

        return response()->json(['data' => $calculation]);
    }

    private function validateProduct(Request $request, bool $partial = false): array
    {
        $rules = [
            'category_id' => ['nullable', 'integer', 'exists:jewelry_categories,id'],
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:64'],
            'barcode' => ['nullable', 'string', 'max:64'],
            'metal_type' => ['nullable', Rule::in(JewelryMetalType::values())],
            'karat' => ['nullable', 'integer', 'min:1', 'max:24'],
            'weight_gram' => ['nullable', 'numeric', 'min:0'],
            'stone_type' => ['nullable', 'string', 'max:100'],
            'stone_carat' => ['nullable', 'numeric', 'min:0'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'labor_cost' => ['nullable', 'numeric', 'min:0'],
            'profit_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'is_manual_price' => ['boolean'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'image_path' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];

        return $request->validate($rules);
    }

    private function ensureOwnership(Request $request, JewelryProduct $product): void
    {
        if ($product->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
