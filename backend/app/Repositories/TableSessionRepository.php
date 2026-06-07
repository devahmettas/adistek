<?php

namespace App\Repositories;

use App\Enums\KitchenStatus;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Models\TableSessionItem;

class TableSessionRepository
{
    public function recordFromTable(RestaurantTable $table): ?TableSession
    {
        $table->loadMissing(['products.category', 'assignedWaiter']);

        $products = $table->products->filter(
            fn ($product) => ($product->pivot->kitchen_status ?? null) !== KitchenStatus::Cancelled->value,
        );

        if ($products->isEmpty()) {
            return null;
        }

        $total = $products->sum(
            fn ($product) => (float) $product->price * (int) ($product->pivot->quantity ?? 1),
        );
        $itemCount = $products->sum(fn ($product) => (int) ($product->pivot->quantity ?? 1));

        $session = TableSession::create([
            'restaurant_id' => $table->restaurant_id,
            'restaurant_table_id' => $table->id,
            'table_name' => $table->name,
            'total_amount' => $total,
            'item_count' => $itemCount,
            'assigned_waiter_id' => $table->assigned_waiter_id,
            'assigned_waiter_name' => $table->assigned_waiter_name ?? $table->assignedWaiter?->name,
            'closed_at' => now(),
        ]);

        foreach ($products as $product) {
            $quantity = (int) ($product->pivot->quantity ?? 1);
            $unitPrice = (float) $product->price;

            TableSessionItem::create([
                'table_session_id' => $session->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'category_name' => $product->category?->name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => $unitPrice * $quantity,
            ]);
        }

        return $session;
    }
}
