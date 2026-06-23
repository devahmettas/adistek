<?php

namespace App\Services;

use App\Enums\JewelryCashSessionStatus;
use App\Enums\JewelryCashTransactionSource;
use App\Enums\JewelryCashTransactionType;
use App\Models\JewelryCashSession;
use App\Models\JewelryCashTransaction;
use App\Support\JewelryCashSessionSchema;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class JewelryCashSessionService
{
    private bool $schemaEnsured = false;

    public function findOpen(int $restaurantId): ?JewelryCashSession
    {
        $this->ensureSchema();

        if (! JewelryCashSessionSchema::isReady()) {
            return null;
        }
        return JewelryCashSession::query()
            ->where('restaurant_id', $restaurantId)
            ->where('status', JewelryCashSessionStatus::Open)
            ->orderByDesc('id')
            ->first();
    }

    public function findForRestaurant(int $restaurantId, int $id): JewelryCashSession
    {
        $this->ensureSchema();

        $session = JewelryCashSession::query()
            ->where('restaurant_id', $restaurantId)
            ->find($id);

        if (! $session) {
            throw new NotFoundHttpException('Kasa oturumu bulunamadı.');
        }

        return $session;
    }

    public function listByRestaurant(int $restaurantId, int $limit = 30): Collection
    {
        $this->ensureSchema();

        if (! JewelryCashSessionSchema::isReady()) {
            return new Collection();
        }

        return JewelryCashSession::query()
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('opened_at')
            ->limit($limit)
            ->get();
    }

    public function getSuggestedOpeningBalance(int $restaurantId): float
    {
        $lastClosed = JewelryCashSession::query()
            ->where('restaurant_id', $restaurantId)
            ->where('status', JewelryCashSessionStatus::Closed)
            ->orderByDesc('closed_at')
            ->first();

        if ($lastClosed && $lastClosed->counted_balance !== null) {
            return (float) $lastClosed->counted_balance;
        }

        return $this->calculateCashBalance($restaurantId);
    }

    private function calculateCashBalance(int $restaurantId): float
    {
        $totalIn = (float) JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('type', JewelryCashTransactionType::In)
            ->sum('amount');

        $totalOut = (float) JewelryCashTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('type', JewelryCashTransactionType::Out)
            ->sum('amount');

        return round($totalIn - $totalOut, 2);
    }

    public function getStatusPayload(int $restaurantId): array
    {
        $this->ensureSchema();

        $currentCashBalance = $this->calculateCashBalance($restaurantId);

        if (! JewelryCashSessionSchema::isReady()) {
            return [
                'is_open' => false,
                'suggested_opening_balance' => round($currentCashBalance, 2),
                'current_cash_balance' => $currentCashBalance,
                'active_session' => null,
            ];
        }

        $openSession = $this->findOpen($restaurantId);
        $suggestedOpeningBalance = $this->getSuggestedOpeningBalance($restaurantId);

        return [
            'is_open' => $openSession !== null,
            'suggested_opening_balance' => round($suggestedOpeningBalance, 2),
            'current_cash_balance' => $currentCashBalance,
            'active_session' => $openSession ? $this->formatSession($openSession, true) : null,
        ];
    }

    public function open(int $restaurantId, float $openingBalance, ?string $notes = null): JewelryCashSession
    {
        $this->ensureSchema();

        if (! JewelryCashSessionSchema::isReady()) {
            throw new BadRequestHttpException(
                'Kasa oturumu tabloları hazır değil. Sunucuda php artisan migrate --force çalıştırın.',
            );
        }

        if ($this->findOpen($restaurantId)) {
            throw new BadRequestHttpException('Kasa zaten açık. Gün sonu almadan yeni açılış yapılamaz.');
        }

        return JewelryCashSession::create([
            'restaurant_id' => $restaurantId,
            'status' => JewelryCashSessionStatus::Open,
            'business_date' => now()->toDateString(),
            'opened_at' => now(),
            'opening_balance' => round(max(0, $openingBalance), 2),
            'opening_notes' => $notes,
        ]);
    }

    public function close(int $restaurantId, float $countedBalance, ?string $notes = null): JewelryCashSession
    {
        $this->ensureSchema();

        if (! JewelryCashSessionSchema::isReady()) {
            throw new BadRequestHttpException(
                'Kasa oturumu tabloları hazır değil. Sunucuda php artisan migrate --force çalıştırın.',
            );
        }

        $session = $this->findOpen($restaurantId);

        if (! $session) {
            throw new BadRequestHttpException('Açık kasa bulunamadı. Önce kasa açılışı yapın.');
        }

        return DB::transaction(function () use ($session, $countedBalance, $notes) {
            $summary = $this->calculateLiveSummary($session);
            $expectedBalance = round(
                (float) $session->opening_balance + $summary['session_cash_in'] - $summary['session_cash_out'],
                2,
            );
            $counted = round(max(0, $countedBalance), 2);
            $difference = round($counted - $expectedBalance, 2);

            $session->update([
                'status' => JewelryCashSessionStatus::Closed,
                'closed_at' => now(),
                'expected_balance' => $expectedBalance,
                'counted_balance' => $counted,
                'cash_difference' => $difference,
                'session_cash_in' => $summary['session_cash_in'],
                'session_cash_out' => $summary['session_cash_out'],
                'transaction_count' => $summary['transaction_count'],
                'cash_sale_count' => $summary['cash_sale_count'],
                'cash_sale_total' => $summary['cash_sale_total'],
                'cash_purchase_count' => $summary['cash_purchase_count'],
                'cash_purchase_total' => $summary['cash_purchase_total'],
                'closing_notes' => $notes,
            ]);

            return $session->fresh();
        });
    }

    public function requireOpen(int $restaurantId): JewelryCashSession
    {
        $session = $this->findOpen($restaurantId);

        if (! $session) {
            throw new BadRequestHttpException('Kasa kapalı. Nakit işlem yapmak için önce kasa açılışı yapın.');
        }

        return $session;
    }

    public function calculateLiveSummary(JewelryCashSession $session): array
    {
        $transactions = JewelryCashTransaction::query()
            ->where('cash_session_id', $session->id)
            ->get();

        $sessionCashIn = 0.0;
        $sessionCashOut = 0.0;
        $cashSaleCount = 0;
        $cashSaleTotal = 0.0;
        $cashPurchaseCount = 0;
        $cashPurchaseTotal = 0.0;

        foreach ($transactions as $transaction) {
            $amount = (float) $transaction->amount;

            if ($transaction->type === JewelryCashTransactionType::In) {
                $sessionCashIn += $amount;

                if ($transaction->source === JewelryCashTransactionSource::Sale) {
                    $cashSaleCount++;
                    $cashSaleTotal += $amount;
                }
            } else {
                $sessionCashOut += $amount;

                if ($transaction->source === JewelryCashTransactionSource::Purchase) {
                    $cashPurchaseCount++;
                    $cashPurchaseTotal += $amount;
                }
            }
        }

        return [
            'session_cash_in' => round($sessionCashIn, 2),
            'session_cash_out' => round($sessionCashOut, 2),
            'transaction_count' => $transactions->count(),
            'cash_sale_count' => $cashSaleCount,
            'cash_sale_total' => round($cashSaleTotal, 2),
            'cash_purchase_count' => $cashPurchaseCount,
            'cash_purchase_total' => round($cashPurchaseTotal, 2),
            'expected_balance' => round(
                (float) $session->opening_balance + $sessionCashIn - $sessionCashOut,
                2,
            ),
        ];
    }

    public function formatSession(JewelryCashSession $session, bool $includeLiveSummary = false): array
    {
        $payload = [
            'id' => $session->id,
            'status' => $session->status->value,
            'status_label' => $session->status->label(),
            'business_date' => $session->business_date?->toDateString(),
            'opened_at' => $session->opened_at?->toIso8601String(),
            'opening_balance' => (float) $session->opening_balance,
            'opening_notes' => $session->opening_notes,
            'closed_at' => $session->closed_at?->toIso8601String(),
            'expected_balance' => $session->expected_balance !== null
                ? (float) $session->expected_balance
                : null,
            'counted_balance' => $session->counted_balance !== null
                ? (float) $session->counted_balance
                : null,
            'cash_difference' => $session->cash_difference !== null
                ? (float) $session->cash_difference
                : null,
            'session_cash_in' => (float) $session->session_cash_in,
            'session_cash_out' => (float) $session->session_cash_out,
            'transaction_count' => (int) $session->transaction_count,
            'cash_sale_count' => (int) $session->cash_sale_count,
            'cash_sale_total' => (float) $session->cash_sale_total,
            'cash_purchase_count' => (int) $session->cash_purchase_count,
            'cash_purchase_total' => (float) $session->cash_purchase_total,
            'closing_notes' => $session->closing_notes,
        ];

        if ($includeLiveSummary && $session->status === JewelryCashSessionStatus::Open) {
            $live = $this->calculateLiveSummary($session);
            $payload['live_summary'] = $live;
            $payload['expected_balance'] = $live['expected_balance'];
            $payload['session_cash_in'] = $live['session_cash_in'];
            $payload['session_cash_out'] = $live['session_cash_out'];
            $payload['transaction_count'] = $live['transaction_count'];
            $payload['cash_sale_count'] = $live['cash_sale_count'];
            $payload['cash_sale_total'] = $live['cash_sale_total'];
            $payload['cash_purchase_count'] = $live['cash_purchase_count'];
            $payload['cash_purchase_total'] = $live['cash_purchase_total'];
        }

        return $payload;
    }

    public function formatSummary(JewelryCashSession $session): array
    {
        return [
            'id' => $session->id,
            'status' => $session->status->value,
            'status_label' => $session->status->label(),
            'business_date' => $session->business_date?->toDateString(),
            'opened_at' => $session->opened_at?->toIso8601String(),
            'closed_at' => $session->closed_at?->toIso8601String(),
            'opening_balance' => (float) $session->opening_balance,
            'expected_balance' => $session->expected_balance !== null
                ? (float) $session->expected_balance
                : null,
            'counted_balance' => $session->counted_balance !== null
                ? (float) $session->counted_balance
                : null,
            'cash_difference' => $session->cash_difference !== null
                ? (float) $session->cash_difference
                : null,
            'session_cash_in' => (float) $session->session_cash_in,
            'session_cash_out' => (float) $session->session_cash_out,
            'transaction_count' => (int) $session->transaction_count,
            'cash_sale_total' => (float) $session->cash_sale_total,
            'cash_purchase_total' => (float) $session->cash_purchase_total,
        ];
    }

    private function ensureSchema(): void
    {
        if ($this->schemaEnsured) {
            return;
        }

        JewelryCashSessionSchema::ensure();
        $this->schemaEnsured = true;
    }
}
