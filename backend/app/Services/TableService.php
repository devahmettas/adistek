<?php

namespace App\Services;

use App\Enums\KitchenStatus;
use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Repositories\ProductRepository;
use App\Repositories\TableRepository;
use App\Repositories\TableSessionRepository;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
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
        private readonly TableSessionRepository $sessionRepository,
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
            'qr_token' => (string) Str::uuid(),
            'status' => TableStatus::Empty->value,
            'occupied_at' => null,
        ]);
    }

    public function update(int $restaurantId, int $tableId, array $data): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        return $this->repository->update($table, [
            'name' => $data['name'],
        ]);
    }

    public function delete(int $restaurantId, int $tableId): void
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        if ($table->status !== TableStatus::Empty) {
            throw new UnprocessableEntityHttpException('Aktif masa silinemez. Önce masayı boşaltın.');
        }

        if ($this->repository->activeProductCount($table) > 0) {
            throw new UnprocessableEntityHttpException('Ürün bulunan masa silinemez.');
        }

        $this->repository->delete($table);
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

        if ($newStatus === TableStatus::Served) {
            $this->repository->acknowledgeActiveKitchenItems($table);
        }

        return $updated->load($this->repository->productRelations());
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

        $isFirstProduct = $table->products()->count() === 0;
        $isExtraOrder = $this->isExtraKitchenOrder($table);

        if ($isExtraOrder) {
            $this->repository->acknowledgeActiveKitchenItems($table);
        }

        $this->repository->attachProduct($table, $product, $quantity, $note, $isExtraOrder);

        $updates = [
            'status' => TableStatus::Ordered->value,
        ];

        if (! $table->occupied_at) {
            $updates['occupied_at'] = now();
        }

        if ($isFirstProduct && $waiterId && ! $table->assigned_waiter_id) {
            $updates['assigned_waiter_id'] = $waiterId;
            $updates['assigned_at'] = now();
        }

        if ($updates !== []) {
            $table->update($updates);
        }

        return $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load($this->repository->productRelations());
    }

    public function updateTableItem(
        int $restaurantId,
        int $tableId,
        int $pivotId,
        int $quantity,
        ?string $note = null,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $pivotExists = $table->products()->wherePivot('id', $pivotId)->exists();

        if (! $pivotExists) {
            throw new NotFoundHttpException('Ürün kalemi bu masada bulunamadı.');
        }

        $this->repository->updateProductPivotById($table, $pivotId, $quantity, $note);

        return $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load($this->repository->productRelations());
    }

    public function cancelTableItem(
        int $restaurantId,
        int $tableId,
        int $pivotId,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $cancelled = $this->repository->cancelProductPivot($table, $pivotId);

        if (! $cancelled) {
            throw new NotFoundHttpException('Ürün kalemi bu masada bulunamadı.');
        }

        return $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load($this->repository->productRelations());
    }

    public function closeTable(int $restaurantId, int $tableId, string $paymentMethod): RestaurantTable
    {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $table->load($this->repository->productRelations());
        $this->sessionRepository->recordFromTable($table, $paymentMethod);

        $this->repository->detachAllProducts($table);

        return $this->repository->update($table, [
            'status' => TableStatus::Empty->value,
            'occupied_at' => null,
            'viewing_waiter_id' => null,
            'viewing_waiter_at' => null,
            'assigned_waiter_id' => null,
            'assigned_at' => null,
        ]);
    }

    public function partialPay(
        int $restaurantId,
        int $tableId,
        string $paymentMethod,
        array $items,
    ): RestaurantTable {
        $table = $this->repository->findForRestaurant($tableId, $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $table->load($this->repository->productRelations());

        $validatedItems = [];

        foreach ($items as $item) {
            $pivotId = (int) $item['pivot_id'];
            $quantity = (int) $item['quantity'];

            $product = $table->products->first(
                fn ($row) => (int) ($row->pivot->id ?? 0) === $pivotId,
            );

            if (
                ! $product
                || ($product->pivot->kitchen_status ?? null) === KitchenStatus::Cancelled->value
            ) {
                throw new UnprocessableEntityHttpException('Seçilen ürünler masada bulunamadı.');
            }

            if ($quantity > (int) ($product->pivot->quantity ?? 0)) {
                throw new UnprocessableEntityHttpException('Seçilen adet masadaki adetten fazla olamaz.');
            }

            $validatedItems[] = [
                'pivot_id' => $pivotId,
                'quantity' => $quantity,
            ];
        }

        if ($validatedItems === []) {
            throw new UnprocessableEntityHttpException('Ödenecek ürün seçilmedi.');
        }

        $session = $this->sessionRepository->recordPartialPayment(
            $table,
            $paymentMethod,
            $validatedItems,
        );

        if (! $session) {
            throw new UnprocessableEntityHttpException('Ödeme kaydedilemedi.');
        }

        $this->repository->reduceProductPivotQuantities($table, $validatedItems);

        if ($this->repository->activeProductCount($table) === 0) {
            return $this->repository->update($table, [
                'status' => TableStatus::Empty->value,
                'occupied_at' => null,
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
                'assigned_waiter_id' => null,
                'assigned_at' => null,
            ]);
        }

        $updates = [];

        if ($table->status === TableStatus::BillRequested) {
            $updates['status'] = TableStatus::Ordered->value;
        }

        if ($updates !== []) {
            $table->update($updates);
        }

        return $this->repository->findForRestaurant($tableId, $restaurantId)
            ->load($this->repository->productRelations());
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

    private function resolveOccupiedAt(TableStatus $status, ?DateTimeInterface $current): ?DateTimeInterface
    {
        if (in_array($status, self::ACTIVE_STATUSES, true)) {
            return $current ?? now();
        }

        return null;
    }

    private function isExtraKitchenOrder(RestaurantTable $table): bool
    {
        if ($table->products()->count() === 0) {
            return false;
        }

        if ($table->status === TableStatus::Served) {
            return true;
        }

        return $this->repository->hasKitchenProcessedItems($table);
    }
}
