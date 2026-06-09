<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Restaurant;
use App\Repositories\MenuSlideRepository;
use App\Support\MenuAssetUrl;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicMenuService
{
    public function __construct(
        private readonly MenuSlideRepository $slideRepository,
    ) {}

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
                    'image_path' => $category->image_path,
                    'image_url' => MenuAssetUrl::resolve($category->image_path),
                    'products' => $categoryProducts
                        ->map(fn (Product $product) => $this->formatProduct($product))
                        ->values(),
                ];
            })
            ->filter()
            ->values();

        $slides = $this->slideRepository
            ->getActiveByRestaurant($restaurant->id)
            ->map(fn ($slide) => [
                'id' => $slide->id,
                'title' => $slide->title,
                'subtitle' => $slide->subtitle,
                'image_path' => $slide->image_path,
                'image_url' => $slide->image_url,
                'link_url' => $slide->link_url,
            ])
            ->values();

        return [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
            ],
            'menu_settings' => [
                'tagline' => $restaurant->menu_tagline,
                'welcome_text' => $restaurant->menu_welcome_text,
            ],
            'slides' => $slides,
            'categories' => $menuCategories,
        ];
    }

    public function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => number_format((float) $product->price, 2, '.', ''),
            'image_path' => $product->image_path,
            'image_url' => MenuAssetUrl::resolve($product->image_path),
            'calories' => $product->calories,
            'allergens' => $product->allergens ?? [],
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
