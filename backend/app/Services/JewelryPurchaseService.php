<?php

namespace App\Services;

use App\Enums\JewelryStockMovementType;
use App\Models\JewelryCategory;
use App\Models\JewelryInventoryLot;
use App\Models\JewelryProduct;
use App\Models\JewelryPurchase;
use App\Models\JewelryPurchaseItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelryPurchaseService
{
    private const GOLD_CATEGORY_NAMES = [
        'Gram Altın',
        'Çeyrek Altın',
        'Yarım Altın',
        'Tam Altın',
        'Ata Altın',
        'Cumhuriyet Altını',
    ];

    public function __construct(
        private readonly JewelryCashService $cashService,
        private readonly JewelryProductService $productService,
        private readonly JewelryInventoryCostService $inventoryCostService,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        return JewelryPurchase::query()
            ->with(['customer', 'items.product'])
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('purchased_at')
            ->get();
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelryPurchase
    {
        $purchase = JewelryPurchase::query()
            ->with(['customer', 'items.product'])
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $purchase) {
            throw new NotFoundHttpException('Alım kaydı bulunamadı.');
        }

        return $purchase;
    }

    public function create(int $restaurantId, array $data): JewelryPurchase
    {
        return DB::transaction(function () use ($restaurantId, $data) {
            $items = $data['items'];
            unset($data['items']);

            $subtotal = 0.0;
            foreach ($items as $item) {
                $subtotal += (float) $item['line_total'];
            }

            $purchase = JewelryPurchase::create([
                ...$data,
                'restaurant_id' => $restaurantId,
                'purchase_number' => $this->generatePurchaseNumber($restaurantId),
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'purchased_at' => $data['purchased_at'] ?? now(),
            ]);

            foreach ($items as $item) {
                $productId = $this->syncProductForPurchaseItem(
                    $restaurantId,
                    $purchase,
                    $item,
                );

                $purchaseItem = JewelryPurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $productId,
                    'item_description' => $item['item_description'],
                    'metal_type' => $item['metal_type'] ?? 'gold',
                    'karat' => $item['karat'] ?? null,
                    'weight_gram' => $item['weight_gram'] ?? 0,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'] ?? 1,
                    'line_total' => $item['line_total'],
                ]);

                $product = JewelryProduct::query()->findOrFail($productId);
                $this->inventoryCostService->addLot(
                    $product,
                    (int) $purchaseItem->quantity,
                    (float) $purchaseItem->unit_price,
                    $purchaseItem->id,
                    $purchase->purchased_at,
                );
            }

            $this->cashService->recordPurchase($restaurantId, $purchase->fresh(['items']));

            return $purchase->load(['customer', 'items.product']);
        });
    }

    public function update(int $restaurantId, int $id, array $data): JewelryPurchase
    {
        return DB::transaction(function () use ($restaurantId, $id, $data) {
            $purchase = $this->findForRestaurant($restaurantId, $id);
            $items = $data['items'] ?? null;
            unset($data['items']);

            if ($items !== null) {
                $oldPurchaseItemIds = $purchase->items()->pluck('id');
                JewelryInventoryLot::query()
                    ->whereIn('purchase_item_id', $oldPurchaseItemIds)
                    ->delete();
                $purchase->items()->delete();

                $subtotal = 0.0;
                foreach ($items as $item) {
                    $subtotal += (float) $item['line_total'];

                    $productId = $this->syncProductForPurchaseItem(
                        $restaurantId,
                        $purchase,
                        $item,
                    );

                    $purchaseItem = JewelryPurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $productId,
                        'item_description' => $item['item_description'],
                        'metal_type' => $item['metal_type'] ?? 'gold',
                        'karat' => $item['karat'] ?? null,
                        'weight_gram' => $item['weight_gram'] ?? 0,
                        'unit_price' => $item['unit_price'],
                        'quantity' => $item['quantity'] ?? 1,
                        'line_total' => $item['line_total'],
                    ]);

                    $product = JewelryProduct::query()->findOrFail($productId);
                    $this->inventoryCostService->addLot(
                        $product,
                        (int) $purchaseItem->quantity,
                        (float) $purchaseItem->unit_price,
                        $purchaseItem->id,
                        $purchase->purchased_at,
                    );
                }

                $data['subtotal'] = $subtotal;
                $data['total'] = $subtotal;
            }

            $purchase->update($data);
            $purchase = $purchase->fresh(['items', 'customer']);

            $this->cashService->syncPurchaseCash($restaurantId, $purchase);

            return $purchase->load(['customer', 'items.product']);
        });
    }

    private function syncProductForPurchaseItem(
        int $restaurantId,
        JewelryPurchase $purchase,
        array $item,
    ): int {
        $quantity = max(1, (int) ($item['quantity'] ?? 1));
        $notes = "Alım #{$purchase->purchase_number}";

        if (! empty($item['product_id'])) {
            $this->productService->adjustStock(
                $restaurantId,
                (int) $item['product_id'],
                $quantity,
                JewelryStockMovementType::Purchase,
                $notes,
            );

            return (int) $item['product_id'];
        }

        $categoryId = $this->resolveCategoryId($restaurantId, $item);
        $name = trim((string) $item['item_description']);
        $weightGram = (float) ($item['weight_gram'] ?? 0);
        $unitPrice = (float) $item['unit_price'];

        $existing = JewelryProduct::query()
            ->where('restaurant_id', $restaurantId)
            ->where('name', $name)
            ->when(
                $categoryId,
                fn ($query) => $query->where('category_id', $categoryId),
                fn ($query) => $query->whereNull('category_id'),
            )
            ->first();

        if ($existing) {
            $this->productService->adjustStock(
                $restaurantId,
                $existing->id,
                $quantity,
                JewelryStockMovementType::Purchase,
                $notes,
            );

            return $existing->id;
        }

        $isPieceProduct = $weightGram <= 0;

        $product = $this->productService->create($restaurantId, [
            'name' => $name,
            'category_id' => $categoryId,
            'metal_type' => $item['metal_type'] ?? 'gold',
            'karat' => (int) ($item['karat'] ?? 22),
            'weight_gram' => $weightGram,
            'purchase_price' => $unitPrice,
            'labor_cost' => 0,
            'profit_rate' => 0,
            'is_manual_price' => $isPieceProduct,
            'sale_price' => $isPieceProduct ? round($unitPrice * 1.05, 2) : 0,
            'stock_quantity' => 0,
            'description' => "Müşteriden alım: {$purchase->purchase_number}",
            'is_active' => true,
        ]);

        $this->productService->adjustStock(
            $restaurantId,
            $product->id,
            $quantity,
            JewelryStockMovementType::Purchase,
            $notes,
        );

        return $product->id;
    }

    private function resolveCategoryId(int $restaurantId, array $item): ?int
    {
        if (! empty($item['category_id'])) {
            return (int) $item['category_id'];
        }

        $description = trim((string) ($item['item_description'] ?? ''));

        foreach (self::GOLD_CATEGORY_NAMES as $categoryName) {
            if (strcasecmp($description, $categoryName) === 0) {
                return $this->ensureCategory($restaurantId, $categoryName)->id;
            }
        }

        return null;
    }

    private function ensureCategory(int $restaurantId, string $name): JewelryCategory
    {
        return JewelryCategory::query()->firstOrCreate(
            [
                'restaurant_id' => $restaurantId,
                'name' => $name,
            ],
            [
                'is_active' => true,
            ],
        );
    }

    private function generatePurchaseNumber(int $restaurantId): string
    {
        $count = JewelryPurchase::where('restaurant_id', $restaurantId)->count() + 1;

        return sprintf('A%06d', $count);
    }
}
