<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryMetalType;
use App\Enums\JewelryPaymentMethod;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryPurchase;
use App\Services\JewelryPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelryPurchaseController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryPurchaseService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listByRestaurant($this->restaurantId($request)),
        ]);
    }

    public function show(Request $request, JewelryPurchase $purchase): JsonResponse
    {
        $this->ensureOwnership($request, $purchase);

        return response()->json([
            'data' => $this->service->findForRestaurant($this->restaurantId($request), $purchase->id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePurchase($request);

        $purchase = $this->service->create($this->restaurantId($request), $data);

        return response()->json(['data' => $purchase], 201);
    }

    public function update(Request $request, JewelryPurchase $purchase): JsonResponse
    {
        $this->ensureOwnership($request, $purchase);

        $data = $this->validatePurchase($request, true);

        $updated = $this->service->update($this->restaurantId($request), $purchase->id, $data);

        return response()->json(['data' => $updated]);
    }

    private function validatePurchase(Request $request, bool $isUpdate = false): array
    {
        $rules = [
            'customer_id' => ['nullable', 'integer', 'exists:jewelry_customers,id'],
            'payment_method' => [$isUpdate ? 'sometimes' : 'required', Rule::in(JewelryPaymentMethod::values())],
            'notes' => ['nullable', 'string'],
            'purchased_at' => ['nullable', 'date'],
            'items' => [$isUpdate ? 'sometimes' : 'required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:jewelry_products,id'],
            'items.*.category_id' => ['nullable', 'integer', 'exists:jewelry_categories,id'],
            'items.*.item_description' => ['required', 'string', 'max:255'],
            'items.*.metal_type' => ['nullable', Rule::in(JewelryMetalType::values())],
            'items.*.karat' => ['nullable', 'integer', 'min:1', 'max:24'],
            'items.*.weight_gram' => ['nullable', 'numeric', 'min:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.line_total' => ['required', 'numeric', 'min:0'],
        ];

        return $request->validate($rules);
    }

    private function ensureOwnership(Request $request, JewelryPurchase $purchase): void
    {
        if ($purchase->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
