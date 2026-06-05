<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\CategoryRepository;
use App\Repositories\ProductRepository;
use App\Repositories\RestaurantRepository;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ProductService
{
    public function __construct(
        private readonly ProductRepository $repository,
        private readonly RestaurantRepository $restaurantRepository,
        private readonly CategoryRepository $categoryRepository,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        $this->ensureRestaurantExists($restaurantId);

        return $this->repository->getByRestaurant($restaurantId);
    }

    public function create(array $data): Product
    {
        $this->ensureRestaurantExists($data['restaurant_id']);
        $this->ensureCategoryBelongsToRestaurant($data['category_id'], $data['restaurant_id']);

        return $this->repository->create($data);
    }

    private function ensureRestaurantExists(int $restaurantId): void
    {
        if (! $this->restaurantRepository->find($restaurantId)) {
            throw new NotFoundHttpException('Restaurant not found.');
        }
    }

    private function ensureCategoryBelongsToRestaurant(int $categoryId, int $restaurantId): void
    {
        $category = $this->categoryRepository->find($categoryId);

        if (! $category || $category->restaurant_id !== $restaurantId) {
            throw new UnprocessableEntityHttpException('Category does not belong to the given restaurant.');
        }
    }
}
