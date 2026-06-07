<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Repositories\TableRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class GuestTableOrderService
{
    public function __construct(
        private readonly TableRepository $tableRepository,
        private readonly PublicMenuService $publicMenuService,
        private readonly TableService $tableService,
    ) {}

    public function getTableOrderPage(string $token): array
    {
        $table = $this->findTableByToken($token);
        $table->load('restaurant');

        $identifier = $table->restaurant->slug ?? (string) $table->restaurant_id;
        $menu = $this->publicMenuService->getMenu($identifier);

        return [
            'table' => [
                'id' => $table->id,
                'name' => $table->name,
            ],
            'restaurant' => $menu['restaurant'],
            'categories' => $menu['categories'],
            'can_order' => $this->canOrder($table),
        ];
    }

    public function placeOrder(string $token, array $items): array
    {
        $table = $this->findTableByToken($token);

        if (! $this->canOrder($table)) {
            throw new UnprocessableEntityHttpException('Bu masadan şu an sipariş verilemiyor.');
        }

        foreach ($items as $item) {
            $this->tableService->addProduct(
                $table->restaurant_id,
                $table->id,
                (int) $item['product_id'],
                (int) ($item['quantity'] ?? 1),
                $item['note'] ?? null,
            );
        }

        return [
            'message' => 'Siparişiniz mutfağa iletildi.',
            'table_name' => $table->name,
            'item_count' => count($items),
        ];
    }

    private function findTableByToken(string $token): RestaurantTable
    {
        $table = $this->tableRepository->findByQrToken($token);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        return $table;
    }

    private function canOrder(RestaurantTable $table): bool
    {
        $status = $table->status instanceof TableStatus
            ? $table->status
            : TableStatus::tryFrom((string) $table->status);

        if ($status === null) {
            return true;
        }

        // Yalnızca rezerve masalar kapalıdır. Teslim edilmiş veya hesap istenmiş
        // masalardan da müşteri ek sipariş verebilir.
        return $status !== TableStatus::Reserved;
    }
}
