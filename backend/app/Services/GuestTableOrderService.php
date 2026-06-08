<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Repositories\TableRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class GuestTableOrderService
{
    private const ACTIVE_STATUSES = [
        TableStatus::Occupied,
        TableStatus::WaitingOrder,
        TableStatus::Ordered,
        TableStatus::Served,
        TableStatus::BillRequested,
    ];

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
        $canOrder = $this->canOrder($table);

        return [
            'table' => [
                'id' => $table->id,
                'name' => $table->name,
            ],
            'restaurant' => $menu['restaurant'],
            'categories' => $menu['categories'],
            'can_order' => $canOrder,
            'session_token' => $canOrder ? $table->guest_order_token : null,
        ];
    }

    public function placeOrder(string $token, string $sessionToken, array $items): array
    {
        $table = $this->findTableByToken($token);

        if (! $this->canOrder($table)) {
            throw new UnprocessableEntityHttpException('Bu masadan şu an sipariş verilemiyor. Garsonunuzun masayı aktif etmesini bekleyin.');
        }

        if (! hash_equals((string) $table->guest_order_token, $sessionToken)) {
            throw new UnprocessableEntityHttpException('Oturum geçersiz. Sayfayı yenileyip tekrar deneyin.');
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
            'message' => 'Siparişiniz alındı. Ürünleriniz hazırlanıyor.',
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

        if ($status === null || ! in_array($status, self::ACTIVE_STATUSES, true)) {
            return false;
        }

        return $table->guest_order_token !== null;
    }
}
