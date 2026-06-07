<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Services\CategoryService;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly CategoryService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->service->listByRestaurant($this->restaurantId($request));

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

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }

        $updatedCategory = $this->service->update(
            $this->restaurantId($request),
            $category->id,
            $request->validated(),
        );

        return response()->json([
            'data' => $updatedCategory,
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }

        $this->service->delete($this->restaurantId($request), $category->id);

        return response()->json([
            'message' => 'Kategori silindi.',
        ]);
    }
}
