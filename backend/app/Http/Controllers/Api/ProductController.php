<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListProductRequest;
use App\Http\Requests\StoreProductRequest;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $service,
    ) {}

    public function index(ListProductRequest $request): JsonResponse
    {
        $products = $this->service->listByRestaurant(
            (int) $request->validated('restaurant_id')
        );

        return response()->json([
            'data' => $products,
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->validated());

        return response()->json([
            'data' => $product,
        ], 201);
    }
}
