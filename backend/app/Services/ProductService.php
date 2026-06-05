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

    public function findForRestaurant(int $restaurantId, int $productId): Product
    {
        $product = $this->repository->findForRestaurant($productId, $restaurantId);

        if (! $product) {
            throw new NotFoundHttpException('Ürün bulunamadı.');
        }

        return $product;
    }

    public function create(array $data): Product
    {
        $this->ensureRestaurantExists($data['restaurant_id']);
        $this->ensureCategoryBelongsToRestaurant($data['category_id'], $data['restaurant_id']);

        $data['is_active'] = $data['is_active'] ?? true;

        return $this->repository->create($data);
    }

    public function update(int $restaurantId, int $productId, array $data): Product
    {
        $product = $this->findForRestaurant($restaurantId, $productId);
        $this->ensureCategoryBelongsToRestaurant($data['category_id'], $restaurantId);

        return $this->repository->update($product, $data);
    }

    public function delete(int $restaurantId, int $productId): void
    {
        $product = $this->findForRestaurant($restaurantId, $productId);
        $this->repository->delete($product);
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
