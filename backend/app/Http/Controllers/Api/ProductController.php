<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->service->listByRestaurant($request->user()->id);

        return response()->json([
            'data' => $products,
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
        ]);

        return response()->json([
            'data' => $product,
        ], 201);
    }
}
