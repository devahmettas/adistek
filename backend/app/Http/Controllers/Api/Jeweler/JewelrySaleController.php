<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryPaymentMethod;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelrySale;
use App\Services\JewelrySaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelrySaleController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelrySaleService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listByRestaurant($this->restaurantId($request)),
        ]);
    }

    public function show(Request $request, JewelrySale $sale): JsonResponse
    {
        $this->ensureOwnership($request, $sale);

        return response()->json([
            'data' => $this->service->findForRestaurant($this->restaurantId($request), $sale->id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:jewelry_customers,id'],
            'payment_method' => ['required', Rule::in(JewelryPaymentMethod::values())],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'sold_at' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer', 'exists:jewelry_products,id'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.weight_gram' => ['nullable', 'numeric', 'min:0'],
            'items.*.labor_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.line_total' => ['required', 'numeric', 'min:0'],
        ]);

        $sale = $this->service->create($this->restaurantId($request), $data);

        return response()->json(['data' => $sale], 201);
    }

    private function ensureOwnership(Request $request, JewelrySale $sale): void
    {
        if ($sale->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
