<?php

namespace App\Services;

use App\Models\RestaurantTable;
use App\Repositories\ProductRepository;
use App\Repositories\TableRepository;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class TableService
{
    public function __construct(
        private readonly TableRepository $repository,
        private readonly ProductRepository $productRepository,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        return $this->repository->getByRestaurant($restaurantId);
    }

    public function create(int $restaurantId, array $data): RestaurantTable
    {
        return $this->repository->create([
            'restaurant_id' => $restaurantId,
            'name' => $data['name'],
        ]);
    }

    public function addProduct(int $restaurantId, int $tableId, int $productId): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $product = $this->productRepository->find($productId);

        if (! $product || $product->restaurant_id !== $restaurantId) {
            throw new UnprocessableEntityHttpException('Ürün bu restorana ait değil.');
        }

        if ($table->products()->where('product_id', $productId)->exists()) {
            throw new UnprocessableEntityHttpException('Ürün zaten bu masada.');
        }

        $this->repository->attachProduct($table, $product);

        return $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load(['products.category']);
    }
}
