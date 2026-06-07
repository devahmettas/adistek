<?php

namespace App\Repositories;

use App\Enums\KitchenStatus;
use App\Models\Product;
use App\Models\RestaurantTable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TableRepository
{
    public function productRelations(): array
    {
        return [
            'products' => fn ($query) => $query->wherePivot(
                'kitchen_status',
                '!=',
                KitchenStatus::Cancelled->value,
            ),
            'products.category',
            'viewingWaiter',
            'assignedWaiter',
        ];
    }

    public function getByRestaurant(int $restaurantId): Collection
    {
        $this->clearStaleViews($restaurantId);

        return RestaurantTable::query()
            ->with($this->productRelations())
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

    public function findByQrToken(string $token): ?RestaurantTable
    {
        return RestaurantTable::query()
            ->where('qr_token', $token)
            ->first();
    }

    public function update(RestaurantTable $table, array $data): RestaurantTable
    {
        $table->update($data);

        return $table->fresh($this->productRelations());
    }

    public function delete(RestaurantTable $table): void
    {
        $table->products()->detach();
        $table->delete();
    }

    public function activeProductCount(RestaurantTable $table): int
    {
        return DB::table('product_restaurant_table')
            ->where('restaurant_table_id', $table->id)
            ->where('kitchen_status', '!=', KitchenStatus::Cancelled->value)
            ->count();
    }

    public function create(array $data): RestaurantTable
    {
        return RestaurantTable::create($data)->load($this->productRelations());
    }

    public function attachProduct(
        RestaurantTable $table,
        Product $product,
        int $quantity = 1,
        ?string $note = null,
        bool $extraOrder = false,
    ): void {
        $normalizedNote = $this->normalizeNote($note);

        $existing = $table->products()
            ->where('product_id', $product->id)
            ->get()
            ->first(function (Product $row) use ($normalizedNote, $extraOrder) {
                if ($this->normalizeNote($row->pivot->note) !== $normalizedNote) {
                    return false;
                }

                if ($extraOrder) {
                    return $row->pivot->kitchen_status === KitchenStatus::Pending->value;
                }

                return true;
            });

        if ($existing) {
            $updates = [
                'quantity' => ($existing->pivot->quantity ?? 1) + $quantity,
            ];

            if (! $extraOrder) {
                $updates['kitchen_status'] = KitchenStatus::Pending->value;
                $updates['ready_at'] = null;
            }

            DB::table('product_restaurant_table')
                ->where('id', $existing->pivot->id)
                ->update($updates);

            return;
        }

        $table->products()->attach($product->id, [
            'quantity' => $quantity,
            'note' => $normalizedNote,
            'kitchen_status' => KitchenStatus::Pending->value,
        ]);
    }

    public function acknowledgeActiveKitchenItems(RestaurantTable $table): void
    {
        DB::table('product_restaurant_table')
            ->where('restaurant_table_id', $table->id)
            ->whereIn('kitchen_status', [
                KitchenStatus::Pending->value,
                KitchenStatus::Ready->value,
            ])
            ->update(['kitchen_status' => KitchenStatus::Acknowledged->value]);
    }

    public function hasKitchenProcessedItems(RestaurantTable $table): bool
    {
        return DB::table('product_restaurant_table')
            ->where('restaurant_table_id', $table->id)
            ->whereIn('kitchen_status', [
                KitchenStatus::Ready->value,
                KitchenStatus::Acknowledged->value,
            ])
            ->exists();
    }

    public function cancelProductPivot(RestaurantTable $table, int $pivotId): bool
    {
        $pivot = DB::table('product_restaurant_table')
            ->where('id', $pivotId)
            ->where('restaurant_table_id', $table->id)
            ->first();

        if (! $pivot) {
            return false;
        }

        if (in_array($pivot->kitchen_status, [
            KitchenStatus::Pending->value,
            KitchenStatus::Ready->value,
        ], true)) {
            DB::table('product_restaurant_table')
                ->where('id', $pivotId)
                ->update(['kitchen_status' => KitchenStatus::Cancelled->value]);

            return true;
        }

        DB::table('product_restaurant_table')->where('id', $pivotId)->delete();

        return true;
    }

    public function updateProductPivotById(
        RestaurantTable $table,
        int $pivotId,
        int $quantity,
        ?string $note = null,
    ): void {
        $pivot = DB::table('product_restaurant_table')
            ->where('id', $pivotId)
            ->where('restaurant_table_id', $table->id)
            ->first();

        if (! $pivot) {
            return;
        }

        if ($quantity <= 0) {
            DB::table('product_restaurant_table')->where('id', $pivotId)->delete();

            return;
        }

        DB::table('product_restaurant_table')
            ->where('id', $pivotId)
            ->update([
                'quantity' => $quantity,
                'note' => $note !== null ? $this->normalizeNote($note) : $pivot->note,
            ]);
    }

    private function normalizeNote(?string $note): ?string
    {
        if ($note === null) {
            return null;
        }

        $trimmed = trim($note);

        return $trimmed === '' ? null : $trimmed;
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

        return $table->fresh($this->productRelations());
    }

    public function releaseView(RestaurantTable $table, int $waiterId): RestaurantTable
    {
        if ((int) $table->viewing_waiter_id === $waiterId) {
            $table->update([
                'viewing_waiter_id' => null,
                'viewing_waiter_at' => null,
            ]);
        }

        return $table->fresh($this->productRelations());
    }

    public function refreshView(RestaurantTable $table, int $waiterId): RestaurantTable
    {
        if ((int) $table->viewing_waiter_id === $waiterId) {
            $table->update(['viewing_waiter_at' => now()]);
        }

        return $table->fresh($this->productRelations());
    }
}
