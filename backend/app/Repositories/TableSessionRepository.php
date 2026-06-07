<?php

namespace App\Repositories;

use App\Enums\KitchenStatus;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use App\Models\TableSessionItem;

class TableSessionRepository
{
    public function recordFromTable(RestaurantTable $table, string $paymentMethod): ?TableSession
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
            'payment_method' => $paymentMethod,
            'item_count' => $itemCount,
            'assigned_waiter_id' => $table->assigned_waiter_id,
            'assigned_waiter_name' => $table->assigned_waiter_name ?? $table->assignedWaiter?->name,
            'closed_at' => now(),
            'is_partial' => false,
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

    public function recordPartialPayment(
        RestaurantTable $table,
        string $paymentMethod,
        array $items,
    ): ?TableSession {
        $table->loadMissing(['products.category', 'assignedWaiter']);

        $payItems = collect($items)->keyBy('pivot_id');
        $sessionLines = [];
        $total = 0.0;
        $itemCount = 0;

        foreach ($table->products as $product) {
            $pivotId = (int) ($product->pivot->id ?? 0);

            if ($pivotId === 0 || ! $payItems->has($pivotId)) {
                continue;
            }

            if (($product->pivot->kitchen_status ?? null) === KitchenStatus::Cancelled->value) {
                continue;
            }

            $payQuantity = (int) $payItems->get($pivotId)['quantity'];
            $unitPrice = (float) $product->price;
            $lineTotal = $unitPrice * $payQuantity;

            $sessionLines[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'category_name' => $product->category?->name,
                'quantity' => $payQuantity,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
            ];

            $total += $lineTotal;
            $itemCount += $payQuantity;
        }

        if ($sessionLines === []) {
            return null;
        }

        $session = TableSession::create([
            'restaurant_id' => $table->restaurant_id,
            'restaurant_table_id' => $table->id,
            'table_name' => $table->name,
            'total_amount' => $total,
            'payment_method' => $paymentMethod,
            'is_partial' => true,
            'item_count' => $itemCount,
            'assigned_waiter_id' => $table->assigned_waiter_id,
            'assigned_waiter_name' => $table->assigned_waiter_name ?? $table->assignedWaiter?->name,
            'closed_at' => now(),
        ]);

        foreach ($sessionLines as $line) {
            TableSessionItem::create([
                'table_session_id' => $session->id,
                ...$line,
            ]);
        }

        return $session;
    }
}
