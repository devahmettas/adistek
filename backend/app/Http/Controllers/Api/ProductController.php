<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly ProductService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->service->listByRestaurant($this->restaurantId($request));

        return response()->json([
            'data' => $products,
        ]);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $item = $this->service->findForRestaurant($this->restaurantId($request), $product->id);

        return response()->json([
            'data' => $item,
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create([
            'restaurant_id' => $request->user()->id,
            'category_id' => $request->validated('category_id'),
            'name' => $request->validated('name'),
            'price' => $request->validated('price'),
            'description' => $request->validated('description'),
            'is_active' => $request->validated('is_active') ?? true,
        ]);

        return response()->json([
            'data' => $product,
        ], 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updated = $this->service->update($request->user()->id, $product->id, $request->validated());

        return response()->json([
            'data' => $updated,
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->service->delete($request->user()->id, $product->id);

        return response()->json([
            'message' => 'Ürün silindi.',
        ]);
    }
}
