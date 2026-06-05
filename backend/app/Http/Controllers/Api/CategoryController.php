<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->service->listByRestaurant($request->user()->id);

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->service->create([
            'restaurant_id' => $request->user()->id,
            'name' => $request->validated('name'),
        ]);

        return response()->json([
            'data' => $category,
        ], 201);
    }
}
