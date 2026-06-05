<?php

namespace App\Repositories;

use App\Models\Product;
use App\Models\RestaurantTable;
use Illuminate\Database\Eloquent\Collection;

class TableRepository
{
    public function getByRestaurant(int $restaurantId): Collection
    {
        $this->clearStaleViews($restaurantId);

        return RestaurantTable::query()
            ->with(['products.category', 'viewingWaiter'])
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findForRestaurant(int $tableId, int $restaurantId): ?RestaurantTable
    {
        return RestaurantTable::query()
            ->where('id', $tableId)
            ->where('restaurant_id', $restaurantId)
            ->first();
    }

    public function create(array $data): RestaurantTable
    {
        return RestaurantTable::create($data)->load(['products.category', 'viewingWaiter']);
    }

    public function update(RestaurantTable $table, array $data): RestaurantTable
    {
        $table->update($data);

        return $table->fresh(['products.category', 'viewingWaiter']);
    }

    public function attachProduct(
        RestaurantTable $table,
        Product $product,
        int $quantity = 1,
        ?string $note = null,
    ): void {
        $existing = $table->products()->where('product_id', $product->id)->first();

        if ($existing) {
            $table->products()->updateExistingPivot($product->id, [
                'quantity' => ($existing->pivot->quantity ?? 1) + $quantity,
                'note' => $note ?? $existing->pivot->note,
            ]);

            return;
        }

        $table->products()->attach($product->id, [
            'quantity' => $quantity,
            'note' => $note,
        ]);
    }

    public function updateProductPivot(
        RestaurantTable $table,
        int $productId,
        int $quantity,
        ?string $note = null,
    ): void {
        if ($quantity <= 0) {
            $table->products()->detach($productId);

            return;
        }

        $existing = $table->products()->where('product_id', $productId)->first();

        if (! $existing) {
            return;
        }

        $table->products()->updateExistingPivot($productId, [
            'quantity' => $quantity,
            'note' => $note,
        ]);
    }

    public function detachAllProducts(RestaurantTable $table): void
    {
        $table->products()->detach();
    }

    public function clearStaleViews(int $restaurantId): void
    {
        RestaurantTable::query()
            ->where('restaurant_id', $restaurantId)
            ->whereNotNull('viewing_waiter_id')
            ->where('viewing_waiter_at', '<', now()->subMinutes(30))
            ->update([
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
            ]);
    }

    public function claimView(RestaurantTable $table, int $waiterId): RestaurantTable
    {
        $table->update([
            'viewing_waiter_id' => $waiterId,
            'viewing_waiter_at' => now(),
        ]);

        return $table->fresh(['products.category', 'viewingWaiter']);
    }

    public function releaseView(RestaurantTable $table, int $waiterId): RestaurantTable
    {
        if ((int) $table->viewing_waiter_id === $waiterId) {
            $table->update([
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
            ]);
        }

        return $table->fresh(['products.category', 'viewingWaiter']);
    }

    public function refreshView(RestaurantTable $table, int $waiterId): RestaurantTable
    {
        if ((int) $table->viewing_waiter_id === $waiterId) {
            $table->update(['viewing_waiter_at' => now()]);
        }

        return $table->fresh(['products.category', 'viewingWaiter']);
    }
}
