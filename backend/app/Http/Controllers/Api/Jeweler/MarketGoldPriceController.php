<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\GoldPriceType;
use App\Http\Controllers\Controller;
use App\Repositories\GoldPriceRecordRepository;
use App\Services\GoldPrices\GoldPriceStreamService;
use App\Services\GoldPrices\GoldPriceSyncService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MarketGoldPriceController extends Controller
{
    public function __construct(
        private readonly GoldPriceSyncService $syncService,
        private readonly GoldPriceStreamService $streamService,
        private readonly GoldPriceRecordRepository $repository,
    ) {}

    public function live(): JsonResponse
    {
        $interval = (float) config('gold_prices.sync_interval_seconds', 1);
        $liveStore = $this->syncService->getLiveStore();

        if ($liveStore->isFresh($interval)) {
            $snapshot = $liveStore->getSnapshot();
            $snapshot['changed'] = false;

            return response()->json(['data' => $snapshot]);
        }

        $sync = $this->syncService->sync();
        $result = $sync['result'];
        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $now = Carbon::now($timezone);

        return response()->json([
            'data' => [
                'prices' => $sync['prices'],
                'changed' => $sync['changed'],
                'stored_count' => $sync['stored_count'],
                'has_gold_base' => $result->hasGoldBase,
                'last_sync_at' => $now->toIso8601String(),
                'server_time' => $now->toIso8601String(),
                'timezone' => $timezone,
                'sync_interval_seconds' => (int) config('gold_prices.sync_interval_seconds', 1),
                'provider' => $result->provider,
                'source' => $result->source,
                'version' => $sync['version'],
                'stream_source' => config('gold_prices.stream_source', 'izko'),
            ],
        ]);
    }

    public function wait(Request $request): JsonResponse
    {
        $data = $request->validate([
            'since_version' => ['nullable', 'integer', 'min:0'],
            'timeout' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);

        $snapshot = $this->streamService->waitForUpdate(
            (int) ($data['since_version'] ?? 0),
            (int) ($data['timeout'] ?? 25),
        );

        return response()->json(['data' => $snapshot]);
    }

    public function latest(): JsonResponse
    {
        $records = $this->syncService->getLatestPrices();
        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $lastSync = $this->repository->getLastSyncAt();

        return response()->json([
            'data' => [
                'prices' => $records,
                'last_sync_at' => $lastSync?->timezone($timezone)->toIso8601String(),
                'server_time' => Carbon::now($timezone)->toIso8601String(),
                'timezone' => $timezone,
                'sync_interval_seconds' => (int) config('gold_prices.sync_interval_seconds', 1),
                'provider' => config('gold_prices.provider'),
                'source' => config('gold_prices.providers.'.config('gold_prices.provider').'.source_label'),
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(GoldPriceType::values())],
            'period' => ['nullable', Rule::in(['24h', '7d', '30d'])],
        ]);

        $period = $data['period'] ?? '24h';
        $from = match ($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            default => Carbon::now()->subDay(),
        };

        $type = GoldPriceType::from($data['type']);
        $history = $this->repository->getHistory($type, $from);

        return response()->json([
            'data' => [
                'type' => $type->value,
                'label' => $type->label(),
                'period' => $period,
                'points' => $history->map(fn ($record) => [
                    'fetched_at' => $record->fetched_at,
                    'cash_sell_price' => (float) $record->cash_sell_price,
                    'card_sell_price' => $record->card_sell_price !== null
                        ? (float) $record->card_sell_price
                        : null,
                    'has_gold_base' => $record->has_gold_base !== null
                        ? (float) $record->has_gold_base
                        : null,
                ])->values(),
            ],
        ]);
    }

    public function sync(): JsonResponse
    {
        $sync = $this->syncService->sync();
        $result = $sync['result'];
        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');

        return response()->json([
            'data' => [
                'synced_count' => count($result->quotes),
                'stored_count' => $sync['stored_count'],
                'changed' => $sync['changed'],
                'has_gold_base' => $result->hasGoldBase,
                'fetched_at' => Carbon::now($timezone)->toIso8601String(),
                'provider' => $result->provider,
                'prices' => $sync['prices'],
            ],
        ]);
    }
}
