<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;
use App\Repositories\RestaurantRepository;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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

    private function ensureRestaurantExists(int $restaurantId): void
    {
        if (! $this->restaurantRepository->find($restaurantId)) {
            throw new NotFoundHttpException('Restaurant not found.');
        }
    }
}
