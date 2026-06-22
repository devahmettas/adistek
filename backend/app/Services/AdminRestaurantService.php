<?php

namespace App\Services;

use App\Enums\BusinessType;
use App\Models\JewelrySetting;
use App\Models\Restaurant;
use App\Repositories\RestaurantRepository;
use App\Support\RestaurantSlugGenerator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Schema;
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
        $businessType = BusinessType::tryFrom($data['business_type'] ?? '') ?? BusinessType::Restaurant;
        $membershipDays = (int) ($data['membership_days'] ?? 30);
        unset($data['business_type'], $data['membership_days']);

        $isJeweler = $businessType === BusinessType::Jeweler;

        $restaurant = $this->repository->create([
            ...$data,
            'business_type' => $businessType,
            'slug' => RestaurantSlugGenerator::generate($data['name']),
            'feature_order_tracking' => ! $isJeweler,
            'feature_qr_menu' => ! $isJeweler,
            'feature_reservations' => ! $isJeweler,
            'feature_jeweler_barcode' => $isJeweler,
            'feature_jeweler_reports' => $isJeweler,
            'service_fee' => $data['service_fee'] ?? 0,
            'membership_end_date' => now()->addDays(max(1, $membershipDays))->toDateString(),
        ]);

        if ($isJeweler) {
            JewelrySetting::create([
                'restaurant_id' => $restaurant->id,
                'default_karat' => 22,
            ]);
        }

        return $restaurant;
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

    public function extendMembership(int $id, int $days): Restaurant
    {
        if (! Schema::hasColumn('restaurants', 'membership_end_date')) {
            throw new \RuntimeException('Üyelik alanları veritabanında tanımlı değil. Migration çalıştırılmalı.');
        }

        $restaurant = $this->getById($id);
        $restaurant->adjustMembership($days);

        return $this->getById($id);
    }

    public function delete(int $id): void
    {
        $restaurant = $this->getById($id);
        $this->repository->delete($restaurant);
    }
}
