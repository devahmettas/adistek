<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Repositories\RestaurantRepository;
use App\Support\RestaurantSlugGenerator;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminRestaurantService
{
    public function __construct(
        private readonly RestaurantRepository $repository,
    ) {}

    public function listAll(): Collection
    {
        return $this->repository->allWithStats();
    }

    public function getById(int $id): Restaurant
    {
        $restaurant = $this->repository->findWithStats($id);

        if (! $restaurant) {
            throw new NotFoundHttpException('Restoran bulunamadı.');
        }

        return $restaurant;
    }

    public function create(array $data): Restaurant
    {
        return $this->repository->create([
            ...$data,
            'slug' => RestaurantSlugGenerator::generate($data['name']),
            'feature_order_tracking' => true,
            'feature_qr_menu' => true,
            'feature_reservations' => true,
        ]);
    }

    public function updateFeatures(int $id, array $data): Restaurant
    {
        $restaurant = $this->getById($id);

        $this->repository->update($restaurant, $data);

        return $this->getById($id);
    }

    public function update(int $id, array $data): Restaurant
    {
        $restaurant = $this->getById($id);
        $updates = $data;

        if (($updates['password'] ?? null) === null || $updates['password'] === '') {
            unset($updates['password']);
        }

        if ($updates['name'] !== $restaurant->name) {
            $updates['slug'] = RestaurantSlugGenerator::generate($updates['name'], $restaurant->id);
        }

        $this->repository->update($restaurant, $updates);

        return $this->getById($id);
    }
}
