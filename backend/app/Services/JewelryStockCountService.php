<?php

namespace App\Services;

use App\Enums\JewelryStockCountStatus;
use App\Models\JewelryProduct;
use App\Models\JewelryStockCount;
use App\Models\JewelryStockCountItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelryStockCountService
{
    private const MANUAL_CATEGORY_NAMES = [
        'Gram Altın',
        'Çeyrek Altın',
    ];

    public function __construct(
        private readonly JewelryCashService $cashService,
        private readonly JewelryProductService $productService,
    ) {}

    public function listByRestaurant(int $restaurantId, int $limit = 20): Collection
    {
        return JewelryStockCount::query()
            ->with(['items'])
            ->withCount('items')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('started_at')
            ->limit($limit)
            ->get();
    }

    public function findActive(int $restaurantId): ?JewelryStockCount
    {
        return JewelryStockCount::query()
            ->with(['items.product'])
            ->where('restaurant_id', $restaurantId)
            ->where('status', JewelryStockCountStatus::Draft)
            ->orderByDesc('id')
            ->first();
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelryStockCount
    {
        $count = JewelryStockCount::query()
            ->with(['items.product'])
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $count) {
            throw new NotFoundHttpException('Stok sayımı bulunamadı.');
        }

        return $count;
    }

    public function start(int $restaurantId): JewelryStockCount
    {
        $existing = $this->findActive($restaurantId);
        if ($existing) {
            throw new BadRequestHttpException('Devam eden bir stok sayımı zaten var.');
        }

        return DB::transaction(function () use ($restaurantId) {
            $cashSummary = $this->cashService->getSummary($restaurantId);

            $count = JewelryStockCount::create([
                'restaurant_id' => $restaurantId,
                'status' => JewelryStockCountStatus::Draft,
                'expected_cash_balance' => $cashSummary['balance'],
                'started_at' => now(),
            ]);

            $products = JewelryProduct::query()
                ->with('category')
                ->where('restaurant_id', $restaurantId)
                ->where('is_active', true)
                ->where('stock_quantity', '>', 0)
                ->orderBy('name')
                ->get();

            foreach ($products as $product) {
                $categoryName = $product->category?->name;
                [$countMode, $entryType] = $this->resolveCountMode($product, $categoryName);

                $expectedQuantity = (int) $product->stock_quantity;
                $expectedWeight = null;

                if ($entryType === 'weight') {
                    $expectedWeight = round((float) $product->weight_gram * max(0, $expectedQuantity), 3);
                }

                JewelryStockCountItem::create([
                    'stock_count_id' => $count->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'barcode' => $product->barcode,
                    'category_name' => $categoryName,
                    'count_mode' => $countMode,
                    'entry_type' => $entryType,
                    'expected_quantity' => $expectedQuantity,
                    'counted_quantity' => 0,
                    'expected_weight_gram' => $expectedWeight,
                    'counted_weight_gram' => $entryType === 'weight' ? 0 : null,
                ]);
            }

            return $count->fresh(['items.product']);
        });
    }

    public function scan(JewelryStockCount $count, string $barcode): JewelryStockCountItem
    {
        $this->ensureDraft($count);

        $product = $this->productService->findByBarcode($count->restaurant_id, $barcode);
        if (! $product) {
            throw new NotFoundHttpException('Barkoda ait ürün bulunamadı.');
        }

        $item = $count->items()->where('product_id', $product->id)->first();
        if (! $item) {
            throw new NotFoundHttpException('Bu ürün sayım listesinde yok.');
        }

        if ($item->count_mode !== 'barcode') {
            throw new BadRequestHttpException('Bu ürün barkod ile sayılamaz; elle giriş yapın.');
        }

        $item->update([
            'counted_quantity' => (int) $item->counted_quantity + 1,
        ]);

        return $item->fresh(['product']);
    }

    public function unscanItem(
        JewelryStockCount $count,
        JewelryStockCountItem $item,
    ): JewelryStockCountItem {
        $this->ensureDraft($count);
        $this->ensureItemBelongsToCount($count, $item);

        if ($item->count_mode !== 'barcode') {
            throw new BadRequestHttpException('Bu ürünün barkod okuması iptal edilemez.');
        }

        if ((int) $item->counted_quantity <= 0) {
            throw new BadRequestHttpException('Bu ürün henüz sayılmamış.');
        }

        $item->update([
            'counted_quantity' => max(0, (int) $item->counted_quantity - 1),
        ]);

        return $item->fresh(['product']);
    }

    public function updateItem(
        JewelryStockCount $count,
        JewelryStockCountItem $item,
        array $data,
    ): JewelryStockCountItem {
        $this->ensureDraft($count);
        $this->ensureItemBelongsToCount($count, $item);

        if ($item->count_mode !== 'manual') {
            throw new BadRequestHttpException('Bu ürün elle düzenlenemez; barkod okutun.');
        }

        $updates = [];

        if ($item->entry_type === 'weight') {
            if (array_key_exists('counted_weight_gram', $data)) {
                $updates['counted_weight_gram'] = round(max(0, (float) $data['counted_weight_gram']), 3);
            }
        } elseif (array_key_exists('counted_quantity', $data)) {
            $updates['counted_quantity'] = max(0, (int) $data['counted_quantity']);
        }

        if ($updates === []) {
            throw new BadRequestHttpException('Güncellenecek alan bulunamadı.');
        }

        $item->update($updates);

        return $item->fresh(['product']);
    }

    public function updateCash(JewelryStockCount $count, float $countedCashBalance): JewelryStockCount
    {
        $this->ensureDraft($count);

        $count->update([
            'counted_cash_balance' => round(max(0, $countedCashBalance), 2),
        ]);

        return $count->fresh(['items.product']);
    }

    public function complete(JewelryStockCount $count): JewelryStockCount
    {
        $this->ensureDraft($count);

        if ($count->counted_cash_balance === null) {
            throw new BadRequestHttpException('Nakit sayımı girilmeden tamamlanamaz.');
        }

        $count->update([
            'status' => JewelryStockCountStatus::Completed,
            'completed_at' => now(),
        ]);

        return $count->fresh(['items.product']);
    }

    public function cancel(JewelryStockCount $count): JewelryStockCount
    {
        $this->ensureDraft($count);

        $count->update([
            'status' => JewelryStockCountStatus::Cancelled,
            'completed_at' => now(),
        ]);

        return $count->fresh(['items.product']);
    }

    public function formatCount(JewelryStockCount $count): array
    {
        $items = $count->items
            ->sortBy(fn (JewelryStockCountItem $item) => [$item->count_mode, $item->name])
            ->values()
            ->map(fn (JewelryStockCountItem $item) => $this->formatItem($item))
            ->all();

        $discrepancies = $this->buildDiscrepancies($count, $count->items);

        return [
            'id' => $count->id,
            'status' => $count->status->value,
            'status_label' => $count->status->label(),
            'expected_cash_balance' => (float) $count->expected_cash_balance,
            'counted_cash_balance' => $count->counted_cash_balance !== null
                ? (float) $count->counted_cash_balance
                : null,
            'cash_difference' => $count->counted_cash_balance !== null
                ? round((float) $count->counted_cash_balance - (float) $count->expected_cash_balance, 2)
                : null,
            'started_at' => $count->started_at?->toIso8601String(),
            'completed_at' => $count->completed_at?->toIso8601String(),
            'notes' => $count->notes,
            'item_count' => count($items),
            'items' => $items,
            'discrepancies' => $discrepancies,
            'discrepancy_count' => count($discrepancies),
        ];
    }

    public function formatSummary(JewelryStockCount $count): array
    {
        $formatted = $this->formatCount($count);

        return [
            'id' => $formatted['id'],
            'status' => $formatted['status'],
            'status_label' => $formatted['status_label'],
            'expected_cash_balance' => $formatted['expected_cash_balance'],
            'counted_cash_balance' => $formatted['counted_cash_balance'],
            'cash_difference' => $formatted['cash_difference'],
            'started_at' => $formatted['started_at'],
            'completed_at' => $formatted['completed_at'],
            'item_count' => $formatted['item_count'],
            'discrepancy_count' => $formatted['discrepancy_count'],
        ];
    }

    private function formatItem(JewelryStockCountItem $item): array
    {
        $difference = $this->itemDifference($item);

        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'name' => $item->name,
            'barcode' => $item->barcode,
            'category_name' => $item->category_name,
            'count_mode' => $item->count_mode,
            'entry_type' => $item->entry_type,
            'expected_quantity' => (int) $item->expected_quantity,
            'counted_quantity' => (int) $item->counted_quantity,
            'expected_weight_gram' => $item->expected_weight_gram !== null
                ? (float) $item->expected_weight_gram
                : null,
            'counted_weight_gram' => $item->counted_weight_gram !== null
                ? (float) $item->counted_weight_gram
                : null,
            'difference' => $difference,
            'has_discrepancy' => abs($difference) > 0.0001,
            'difference_label' => $this->differenceLabel($difference, $item->entry_type),
        ];
    }

    private function buildDiscrepancies(JewelryStockCount $count, Collection $items): array
    {
        $discrepancies = [];

        foreach ($items as $item) {
            $difference = $this->itemDifference($item);
            if (abs($difference) <= 0.0001) {
                continue;
            }

            $discrepancies[] = [
                'type' => 'product',
                'item_id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->name,
                'category_name' => $item->category_name,
                'entry_type' => $item->entry_type,
                'expected' => $item->entry_type === 'weight'
                    ? (float) $item->expected_weight_gram
                    : (int) $item->expected_quantity,
                'counted' => $item->entry_type === 'weight'
                    ? (float) $item->counted_weight_gram
                    : (int) $item->counted_quantity,
                'difference' => $difference,
                'difference_label' => $this->differenceLabel($difference, $item->entry_type),
                'unit' => $item->entry_type === 'weight' ? 'gr' : 'adet',
            ];
        }

        if ($count->counted_cash_balance !== null) {
            $cashDiff = round((float) $count->counted_cash_balance - (float) $count->expected_cash_balance, 2);
            if (abs($cashDiff) > 0.009) {
                $discrepancies[] = [
                    'type' => 'cash',
                    'name' => 'Nakit Kasa',
                    'expected' => (float) $count->expected_cash_balance,
                    'counted' => (float) $count->counted_cash_balance,
                    'difference' => $cashDiff,
                    'difference_label' => $this->differenceLabel($cashDiff, 'cash'),
                    'unit' => '₺',
                ];
            }
        }

        return $discrepancies;
    }

    private function itemDifference(JewelryStockCountItem $item): float
    {
        if ($item->entry_type === 'weight') {
            return round(
                (float) ($item->counted_weight_gram ?? 0) - (float) ($item->expected_weight_gram ?? 0),
                3,
            );
        }

        return (float) ((int) $item->counted_quantity - (int) $item->expected_quantity);
    }

    private function differenceLabel(float $difference, string $entryType): string
    {
        if (abs($difference) <= ($entryType === 'cash' ? 0.009 : 0.0001)) {
            return 'Uyumlu';
        }

        if ($difference < 0) {
            return $entryType === 'cash'
                ? 'Nakit açık'
                : ($entryType === 'weight' ? 'Gram açık' : 'Stok açık');
        }

        return $entryType === 'cash' ? 'Nakit fazla' : 'Fazla';
    }

    private function resolveCountMode(JewelryProduct $product, ?string $categoryName): array
    {
        if ($categoryName === 'Gram Altın') {
            return ['manual', 'weight'];
        }

        if (in_array($categoryName, self::MANUAL_CATEGORY_NAMES, true)) {
            return ['manual', 'quantity'];
        }

        if ($product->barcode) {
            return ['barcode', 'quantity'];
        }

        return ['manual', 'quantity'];
    }

    private function ensureDraft(JewelryStockCount $count): void
    {
        if ($count->status !== JewelryStockCountStatus::Draft) {
            throw new BadRequestHttpException('Bu stok sayımı düzenlenemez.');
        }
    }

    private function ensureItemBelongsToCount(JewelryStockCount $count, JewelryStockCountItem $item): void
    {
        if ((int) $item->stock_count_id !== (int) $count->id) {
            throw new NotFoundHttpException('Sayım kalemi bulunamadı.');
        }
    }
}
