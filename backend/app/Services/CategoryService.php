<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;
use App\Repositories\RestaurantRepository;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class CategoryService
{
    public function __construct(
        private readonly CategoryRepository $repository,
        private readonly RestaurantRepository $restaurantRepository,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        $this->ensureRestaurantExists($restaurantId);

        return $this->repository->getByRestaurant($restaurantId);
    }

    public function create(array $data): Category
    {
        $this->ensureRestaurantExists($data['restaurant_id']);

        return $this->repository->create($data);
    }

    public function update(int $restaurantId, int $categoryId, array $data): Category
    {
        $category = $this->repository->findForRestaurant($categoryId, $restaurantId);

        if (! $category) {
            throw new NotFoundHttpException('Kategori bulunamadı.');
        }

        return $this->repository->update($category, [
            'name' => $data['name'],
        ]);
    }

    public function delete(int $restaurantId, int $categoryId): void
    {
        $category = $this->repository->findForRestaurant($categoryId, $restaurantId);

        if (! $category) {
            throw new NotFoundHttpException('Kategori bulunamadı.');
        }

        if ($this->repository->productCount($category) > 0) {
            throw new UnprocessableEntityHttpException('Ürün bulunan kategori silinemez.');
        }

        $this->repository->delete($category);
    }

    private function ensureRestaurantExists(int $restaurantId): void
    {
        if (! $this->restaurantRepository->find($restaurantId)) {
            throw new NotFoundHttpException('Restaurant not found.');
        }
    }
}
