<?php

namespace App\Services;

use App\Enums\KitchenStatus;
use App\Models\RestaurantTable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class KitchenOrderService
{
    public function listPendingOrders(int $restaurantId): Collection
    {
        $activeStatuses = [
            KitchenStatus::Pending->value,
            KitchenStatus::Ready->value,
            KitchenStatus::Cancelled->value,
        ];

        return RestaurantTable::query()
            ->where('restaurant_id', $restaurantId)
            ->whereHas('products', fn ($query) => $query->whereIn('product_restaurant_table.kitchen_status', $activeStatuses))
            ->with(['products' => fn ($query) => $query
                ->whereIn('product_restaurant_table.kitchen_status', $activeStatuses)
                ->orderBy('product_restaurant_table.created_at'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (RestaurantTable $table) => [
                'table_id' => $table->id,
                'table_name' => $table->name,
                'items' => $table->products->map(fn ($product) => [
                    'pivot_id' => $product->pivot->id,
                    'product_name' => $product->name,
                    'description' => $product->description,
                    'quantity' => $product->pivot->quantity ?? 1,
                    'note' => $product->pivot->note,
                    'kitchen_status' => $product->pivot->kitchen_status,
                    'ready_at' => $product->pivot->ready_at,
                    'created_at' => $product->pivot->created_at,
                ])->values(),
            ])
            ->filter(fn (array $order) => $order['items']->isNotEmpty())
            ->values();
    }

    public function markReady(int $restaurantId, int $pivotId): void
    {
        $updated = DB::table('product_restaurant_table')
            ->join('restaurant_tables', 'restaurant_tables.id', '=', 'product_restaurant_table.restaurant_table_id')
            ->where('product_restaurant_table.id', $pivotId)
            ->where('restaurant_tables.restaurant_id', $restaurantId)
            ->where('product_restaurant_table.kitchen_status', KitchenStatus::Pending->value)
            ->update([
                'product_restaurant_table.kitchen_status' => KitchenStatus::Ready->value,
                'product_restaurant_table.ready_at' => now(),
            ]);

        if ($updated === 0) {
            throw new NotFoundHttpException('Sipariş bulunamadı.');
        }
    }

    public function acknowledgeTableReadyItems(int $restaurantId, int $tableId): void
    {
        $table = RestaurantTable::query()
            ->where('id', $tableId)
            ->where('restaurant_id', $restaurantId)
            ->first();

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        DB::table('product_restaurant_table')
            ->where('restaurant_table_id', $tableId)
            ->whereIn('kitchen_status', [
                KitchenStatus::Ready->value,
                KitchenStatus::Cancelled->value,
            ])
            ->update(['kitchen_status' => KitchenStatus::Acknowledged->value]);
    }

    public function dismissCancelled(int $restaurantId, int $pivotId): void
    {
        $deleted = DB::table('product_restaurant_table')
            ->join('restaurant_tables', 'restaurant_tables.id', '=', 'product_restaurant_table.restaurant_table_id')
            ->where('product_restaurant_table.id', $pivotId)
            ->where('restaurant_tables.restaurant_id', $restaurantId)
            ->where('product_restaurant_table.kitchen_status', KitchenStatus::Cancelled->value)
            ->delete();

        if ($deleted === 0) {
            throw new NotFoundHttpException('İptal bildirimi bulunamadı.');
        }
    }
}
