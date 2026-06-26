<?php

namespace App\Services;

use App\Enums\BusinessType;
use App\Models\JewelrySetting;
use App\Models\Restaurant;
use App\Repositories\RestaurantRepository;
use App\Support\RestaurantAdminSchema;
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
        RestaurantAdminSchema::ensure();

        return $this->repository->allWithStats();
    }

    public function getById(int $id): Restaurant
    {
        RestaurantAdminSchema::ensure();

        $restaurant = $this->repository->findWithStats($id);

        if (! $restaurant) {
            throw new NotFoundHttpException('İşletme bulunamadı.');
        }

        return $restaurant;
    }

    public function create(array $data): Restaurant
    {
        RestaurantAdminSchema::ensure();

        $membershipDays = (int) ($data['membership_days'] ?? 30);
        $featureBarcode = (bool) ($data['feature_jeweler_barcode'] ?? true);
        $featureReports = (bool) ($data['feature_jeweler_reports'] ?? true);

        unset(
            $data['business_type'],
            $data['membership_days'],
            $data['feature_jeweler_barcode'],
            $data['feature_jeweler_reports'],
        );

        $restaurant = $this->repository->create([
            ...$data,
            'business_type' => BusinessType::Jeweler,
            'slug' => RestaurantSlugGenerator::generate($data['name']),
            'feature_order_tracking' => false,
            'feature_qr_menu' => false,
            'feature_reservations' => false,
            'feature_jeweler_barcode' => $featureBarcode,
            'feature_jeweler_reports' => $featureReports,
            'service_fee' => $data['service_fee'] ?? 0,
            'membership_end_date' => now()->addDays(max(1, $membershipDays))->toDateString(),
        ]);

        JewelrySetting::create([
            'restaurant_id' => $restaurant->id,
            'default_karat' => 22,
        ]);

        return $restaurant;
    }

    public function updateFeatures(int $id, array $data): Restaurant
    {
        RestaurantAdminSchema::ensure();

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
        RestaurantAdminSchema::ensure();

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
