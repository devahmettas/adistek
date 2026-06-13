<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryCategoryController extends Controller
{
    use ResolvesRestaurantId;

    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $this->ensureGoldPurchaseCategories($restaurantId);

        $categories = JewelryCategory::query()
            ->where('restaurant_id', $restaurantId)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category = JewelryCategory::create([
            ...$data,
            'restaurant_id' => $this->restaurantId($request),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, JewelryCategory $category): JsonResponse
    {
        $this->ensureOwnership($request, $category);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category->update($data);

        return response()->json(['data' => $category->refresh()]);
    }

    public function destroy(Request $request, JewelryCategory $category): JsonResponse
    {
        $this->ensureOwnership($request, $category);
        $category->delete();

        return response()->json(['message' => 'Kategori silindi.']);
    }

    private function ensureOwnership(Request $request, JewelryCategory $category): void
    {
        if ($category->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }

    private function ensureGoldPurchaseCategories(int $restaurantId): void
    {
        $defaults = [
            'Gram Altın',
            'Çeyrek Altın',
            'Yarım Altın',
            'Tam Altın',
            'Ata Altın',
            'Cumhuriyet Altını',
        ];

        foreach ($defaults as $name) {
            JewelryCategory::query()->firstOrCreate(
                [
                    'restaurant_id' => $restaurantId,
                    'name' => $name,
                ],
                [
                    'is_active' => true,
                ],
            );
        }
    }
}
