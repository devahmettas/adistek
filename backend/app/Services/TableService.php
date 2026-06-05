<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Repositories\ProductRepository;
use App\Repositories\TableRepository;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class TableService
{
    private const ACTIVE_STATUSES = [
        TableStatus::Occupied,
        TableStatus::WaitingOrder,
        TableStatus::Ordered,
        TableStatus::Served,
        TableStatus::BillRequested,
    ];

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
            'status' => TableStatus::Empty->value,
            'occupied_at' => null,
        ]);
    }

    public function updateStatus(
        int $restaurantId,
        int $tableId,
        string $status,
        ?int $waiterId = null,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $newStatus = TableStatus::from($status);

        $updated = $this->repository->update($table, [
            'status' => $status,
            'occupied_at' => $this->resolveOccupiedAt($newStatus, $table->occupied_at),
        ]);

        return $this->assignWaiter($updated, $waiterId);
    }

    public function addProduct(
        int $restaurantId,
        int $tableId,
        int $productId,
        int $quantity = 1,
        ?string $note = null,
        ?int $waiterId = null,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $product = $this->productRepository->find($productId);

        if (! $product || $product->restaurant_id !== $restaurantId) {
            throw new UnprocessableEntityHttpException('Ürün bu restorana ait değil.');
        }

        if (! $product->is_active) {
            throw new UnprocessableEntityHttpException('Pasif ürün masaya eklenemez.');
        }

        $this->repository->attachProduct($table, $product, $quantity, $note);

        $updates = [];

        if ($table->status === TableStatus::Empty) {
            $updates['status'] = TableStatus::WaitingOrder->value;
            $updates['occupied_at'] = $table->occupied_at ?? now();
        }

        if ($updates !== []) {
            $table->update($updates);
        }

        $table = $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load(['products.category', 'viewingWaiter']);

        return $this->assignWaiter($table, $waiterId);
    }

    public function updateProduct(
        int $restaurantId,
        int $tableId,
        int $productId,
        int $quantity,
        ?string $note = null,
        ?int $waiterId = null,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $product = $table->products()->where('product_id', $productId)->first();

        if (! $product) {
            throw new NotFoundHttpException('Ürün bu masada bulunamadı.');
        }

        $this->repository->updateProductPivot(
            $table,
            $productId,
            $quantity,
            $note ?? $product->pivot->note,
        );

        $table = $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load(['products.category', 'viewingWaiter']);

        return $this->assignWaiter($table, $waiterId);
    }

    public function closeTable(int $restaurantId, int $tableId): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $this->repository->detachAllProducts($table);

        return $this->repository->update($table, [
            'status' => TableStatus::Empty->value,
            'occupied_at' => null,
            'viewing_waiter_id' => null,
            'viewing_waiter_at' => null,
        ]);
    }

    public function claimView(int $restaurantId, int $tableId, int $waiterId): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        return $this->repository->claimView($table, $waiterId);
    }

    public function releaseView(int $restaurantId, int $tableId, int $waiterId): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        return $this->repository->releaseView($table, $waiterId);
    }

    private function assignWaiter(RestaurantTable $table, ?int $waiterId): RestaurantTable
    {
        if (! $waiterId) {
            return $table;
        }

        return $this->repository->claimView($table, $waiterId);
    }

    private function resolveOccupiedAt(TableStatus $status, ?DateTimeInterface $current): ?DateTimeInterface
    {
        if (in_array($status, self::ACTIVE_STATUSES, true)) {
            return $current ?? now();
        }

        return null;
    }
}
