<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListCategoryRequest;
use App\Http\Requests\StoreCategoryRequest;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $service,
    ) {}

    public function index(ListCategoryRequest $request): JsonResponse
    {
        $categories = $this->service->listByRestaurant(
            (int) $request->validated('restaurant_id')
        );

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->service->create($request->validated());

        return response()->json([
            'data' => $category,
        ], 201);
    }
}
