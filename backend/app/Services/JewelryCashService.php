<?php

namespace App\Services;

use App\Enums\JewelryCashTransactionSource;
use App\Enums\JewelryCashTransactionType;
use App\Models\JewelryCashTransaction;
use App\Models\JewelryPurchase;
use App\Models\JewelrySale;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelryCashService
{
    public function getSummary(int $restaurantId): array
    {
        $totalIn = (float) JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('type', JewelryCashTransactionType::In)
            ->sum('amount');

        $totalOut = (float) JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('type', JewelryCashTransactionType::Out)
            ->sum('amount');

        $transactionCount = JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->count();

        return [
            'balance' => round($totalIn - $totalOut, 2),
            'total_in' => round($totalIn, 2),
            'total_out' => round($totalOut, 2),
            'transaction_count' => $transactionCount,
        ];
    }

    public function listRecent(int $restaurantId, int $limit = 50): Collection
    {
        return JewelryCashTransaction::query()
            ->with(['sale:id,sale_number', 'purchase:id,purchase_number'])
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function recordManual(
        int $restaurantId,
        JewelryCashTransactionType $type,
        float $amount,
        ?string $notes = null,
    ): JewelryCashTransaction {
        return JewelryCashTransaction::create([
            'restaurant_id' => $restaurantId,
            'type' => $type,
            'source' => JewelryCashTransactionSource::Manual,
            'amount' => round($amount, 2),
            'notes' => $notes,
            'created_at' => now(),
        ]);
    }

    public function recordSale(int $restaurantId, JewelrySale $sale): ?JewelryCashTransaction
    {
        if ($sale->payment_method !== 'cash' || (float) $sale->total <= 0) {
            return null;
        }

        return JewelryCashTransaction::create([
            'restaurant_id' => $restaurantId,
            'type' => JewelryCashTransactionType::In,
            'source' => JewelryCashTransactionSource::Sale,
            'amount' => round((float) $sale->total, 2),
            'notes' => "Satış #{$sale->sale_number}",
            'sale_id' => $sale->id,
            'created_at' => $sale->sold_at ?? now(),
        ]);
    }

    public function recordPurchase(int $restaurantId, JewelryPurchase $purchase): ?JewelryCashTransaction
    {
        if ($purchase->payment_method !== 'cash' || (float) $purchase->total <= 0) {
            return null;
        }

        return JewelryCashTransaction::create([
            'restaurant_id' => $restaurantId,
            'type' => JewelryCashTransactionType::Out,
            'source' => JewelryCashTransactionSource::Purchase,
            'amount' => round((float) $purchase->total, 2),
            'notes' => "Alım #{$purchase->purchase_number}",
            'purchase_id' => $purchase->id,
            'created_at' => $purchase->purchased_at ?? now(),
        ]);
    }

    public function syncPurchaseCash(int $restaurantId, JewelryPurchase $purchase): void
    {
        $existing = JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('purchase_id', $purchase->id)
            ->first();

        if ($purchase->payment_method === 'cash' && (float) $purchase->total > 0) {
            if ($existing) {
                $existing->update([
                    'amount' => round((float) $purchase->total, 2),
                    'notes' => "Alım #{$purchase->purchase_number}",
                    'created_at' => $purchase->purchased_at ?? $existing->created_at,
                ]);

                return;
            }

            $this->recordPurchase($restaurantId, $purchase);

            return;
        }

        $existing?->delete();
    }

    public function syncSaleCash(int $restaurantId, JewelrySale $sale): void
    {
        $existing = JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('sale_id', $sale->id)
            ->first();

        if ($sale->payment_method === 'cash' && (float) $sale->total > 0) {
            if ($existing) {
                $existing->update([
                    'amount' => round((float) $sale->total, 2),
                    'notes' => "Satış #{$sale->sale_number}",
                    'created_at' => $sale->sold_at ?? $existing->created_at,
                ]);

                return;
            }

            $this->recordSale($restaurantId, $sale);

            return;
        }

        $existing?->delete();
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelryCashTransaction
    {
        $transaction = JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $transaction) {
            throw new NotFoundHttpException('Nakit işlemi bulunamadı.');
        }

        return $transaction;
    }

    public function updateManual(
        JewelryCashTransaction $transaction,
        JewelryCashTransactionType $type,
        float $amount,
        ?string $notes = null,
    ): JewelryCashTransaction {
        if ($transaction->source !== JewelryCashTransactionSource::Manual) {
            throw new BadRequestHttpException('Sadece manuel nakit işlemleri düzenlenebilir.');
        }

        $transaction->update([
            'type' => $type,
            'amount' => round($amount, 2),
            'notes' => $notes,
        ]);

        return $transaction->fresh(['sale:id,sale_number']);
    }

    public function formatTransaction(JewelryCashTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type->value,
            'type_label' => $transaction->type->label(),
            'source' => $transaction->source->value,
            'source_label' => $transaction->source->label(),
            'amount' => (float) $transaction->amount,
            'notes' => $transaction->notes,
            'sale_id' => $transaction->sale_id,
            'sale_number' => $transaction->sale?->sale_number,
            'purchase_id' => $transaction->purchase_id,
            'purchase_number' => $transaction->purchase?->purchase_number,
            'created_at' => $transaction->created_at?->toIso8601String(),
        ];
    }
}
