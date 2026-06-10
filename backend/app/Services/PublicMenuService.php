<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Restaurant;
use App\Repositories\MenuSlideRepository;
use App\Support\LocalizedText;
use App\Support\MenuAssetUrl;
use App\Support\RestaurantFeatures;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PublicMenuService
{
    public function __construct(
        private readonly MenuSlideRepository $slideRepository,
        private readonly MenuTranslationService $translationService,
    ) {}

    public function getMenu(string $identifier, ?string $lang = null, bool $requireQrFeature = true): array
    {
        $lang = LocalizedText::normalizeLang($lang);
        $restaurant = $this->findRestaurant($identifier);

        if (! $restaurant) {
            throw new NotFoundHttpException('Restoran bulunamadı.');
        }

        if ($requireQrFeature && ! RestaurantFeatures::isEnabled($restaurant, RestaurantFeatures::QR_MENU)) {
            throw new NotFoundHttpException('Menü bulunamadı.');
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

        $slides = $this->slideRepository->getActiveByRestaurant($restaurant->id);

        $textsToTranslate = [];

        if ($lang !== 'tr') {
            set_time_limit(90);

            foreach ($categories as $category) {
                $textsToTranslate[] = $category->name;
            }

            foreach ($products->flatten() as $product) {
                $textsToTranslate[] = $product->name;

                if ($product->description) {
                    $textsToTranslate[] = $product->description;
                }
            }

            if ($restaurant->menu_tagline) {
                $textsToTranslate[] = $restaurant->menu_tagline;
            }

            if ($restaurant->menu_welcome_text) {
                $textsToTranslate[] = $restaurant->menu_welcome_text;
            }

            foreach ($slides as $slide) {
                $textsToTranslate[] = $slide->title;

                if ($slide->subtitle) {
                    $textsToTranslate[] = $slide->subtitle;
                }
            }
        }

        $translations = $lang === 'tr'
            ? []
            : $this->translationService->translateMany($textsToTranslate, $lang);

        $translate = fn (?string $text): ?string => $this->resolveText($text, $lang, $translations);

        $menuCategories = $categories
            ->map(function (Category $category) use ($products, $translate) {
                $categoryProducts = $products->get($category->id, collect());

                if ($categoryProducts->isEmpty()) {
                    return null;
                }

                return [
                    'id' => $category->id,
                    'name' => $translate($category->name),
                    'image_path' => $category->image_path,
                    'image_url' => MenuAssetUrl::resolve($category->image_path),
                    'products' => $categoryProducts
                        ->map(fn (Product $product) => $this->formatProduct($product, $translate))
                        ->values(),
                ];
            })
            ->filter()
            ->values();

        $formattedSlides = $slides
            ->map(fn ($slide) => [
                'id' => $slide->id,
                'title' => $translate($slide->title),
                'subtitle' => $translate($slide->subtitle),
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
                'tagline' => $translate($restaurant->menu_tagline),
                'welcome_text' => $translate($restaurant->menu_welcome_text),
            ],
            'slides' => $formattedSlides,
            'categories' => $menuCategories,
            'language' => $lang,
        ];
    }

    /**
     * @param  callable(?string): ?string  $translate
     */
    public function formatProduct(Product $product, callable $translate): array
    {
        return [
            'id' => $product->id,
            'name' => $translate($product->name),
            'description' => $translate($product->description),
            'price' => number_format((float) $product->price, 2, '.', ''),
            'image_path' => $product->image_path,
            'image_url' => MenuAssetUrl::resolve($product->image_path),
            'calories' => $product->calories,
            'allergens' => $product->allergens ?? [],
        ];
    }

    /**
     * @param  array<string, string>  $translations
     */
    private function resolveText(?string $text, string $lang, array $translations): ?string
    {
        if ($text === null) {
            return null;
        }

        $text = trim($text);

        if ($text === '') {
            return null;
        }

        if ($lang === 'tr') {
            return $text;
        }

        return $translations[$text] ?? $text;
    }

    private function findRestaurant(string $identifier): ?Restaurant
    {
        if (ctype_digit($identifier)) {
            return Restaurant::query()->find((int) $identifier);
        }

        return Restaurant::query()->where('slug', $identifier)->first();
    }
}
