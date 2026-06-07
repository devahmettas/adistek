<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Restaurant;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicMenuService
{
    public function getMenu(string $identifier): array
    {
        $restaurant = $this->findRestaurant($identifier);

        if (! $restaurant) {
            throw new NotFoundHttpException('Restoran bulunamadı.');
        }

        $categories = Category::query()
            ->where('restaurant_id', $restaurant->id)
            ->orderBy('name')
            ->get();

        $products = Product::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->groupBy('category_id');

        $menuCategories = $categories
            ->map(function (Category $category) use ($products) {
                $categoryProducts = $products->get($category->id, collect());

                if ($categoryProducts->isEmpty()) {
                    return null;
                }

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'products' => $categoryProducts->map(fn (Product $product) => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'description' => $product->description,
                        'price' => number_format((float) $product->price, 2, '.', ''),
                    ])->values(),
                ];
            })
            ->filter()
            ->values();

        return [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
            ],
            'categories' => $menuCategories,
        ];
    }

    private function findRestaurant(string $identifier): ?Restaurant
    {
        if (ctype_digit($identifier)) {
            return Restaurant::query()->find((int) $identifier);
        }

        return Restaurant::query()->where('slug', $identifier)->first();
    }
}
