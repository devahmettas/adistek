<?php

namespace App\Services\GoldPrices;

use App\Support\MarketGoldPricePresenter;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class GoldPriceLiveStore
{
    private const SNAPSHOT_KEY = 'gold_prices.live_snapshot';

    private const VERSION_KEY = 'gold_prices.live_version';

    private const HAS_KEY = 'gold_prices.last_has';

    private const SIGNATURE_KEY = 'gold_prices.live_signature';

    public function publish(Collection $prices, ?float $hasGoldBase, string $provider, string $source, bool $force = false): int
    {
        $signature = $this->buildSignature($prices, $hasGoldBase);
        $previousSignature = Cache::get(self::SIGNATURE_KEY);

        if (! $force && $previousSignature === $signature) {
            return $this->getVersion();
        }

        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $now = Carbon::now($timezone);
        $version = $this->getVersion() + 1;

        $snapshot = [
            'prices' => MarketGoldPricePresenter::formatCollection($prices),
            'has_gold_base' => $hasGoldBase,
            'last_sync_at' => $now->toIso8601String(),
            'server_time' => $now->toIso8601String(),
            'timezone' => $timezone,
            'sync_interval_seconds' => (int) config('gold_prices.sync_interval_seconds', 1),
            'provider' => $provider,
            'source' => $source,
            'stream_source' => config('gold_prices.stream_source', 'izko'),
            'version' => $version,
            'changed' => true,
        ];

        Cache::put(self::SNAPSHOT_KEY, $snapshot, now()->addHour());
        Cache::put(self::VERSION_KEY, $version, now()->addHour());
        Cache::put(self::SIGNATURE_KEY, $signature, now()->addHour());

        if ($hasGoldBase !== null) {
            Cache::put(self::HAS_KEY, $hasGoldBase, now()->addHour());
        }

        return $version;
    }

    private function buildSignature(Collection $prices, ?float $hasGoldBase): string
    {
        $parts = $prices->map(function ($price) {
            $type = $price->type instanceof \BackedEnum ? $price->type->value : (string) $price->type;

            return implode(':', [
                $type,
                (string) $price->cash_sell_price,
                (string) ($price->card_sell_price ?? ''),
            ]);
        })->sort()->values()->all();

        return hash('xxh128', implode('|', $parts).':'.($hasGoldBase ?? ''));
    }

    public function getVersion(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 0);
    }

    public function getLastHasPrice(): ?float
    {
        $value = Cache::get(self::HAS_KEY);

        return $value !== null ? (float) $value : null;
    }

    public function isFresh(float $maxAgeSeconds): bool
    {
        $snapshot = Cache::get(self::SNAPSHOT_KEY);

        if (! is_array($snapshot) || empty($snapshot['prices'])) {
            return false;
        }

        $lastSyncAt = $snapshot['last_sync_at'] ?? null;

        if (! is_string($lastSyncAt) || $lastSyncAt === '') {
            return false;
        }

        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $ageSeconds = Carbon::parse($lastSyncAt)->timezone($timezone)->diffInSeconds(
            Carbon::now($timezone),
            absolute: true,
        );

        return $ageSeconds < $maxAgeSeconds;
    }

    public function getSnapshot(): array
    {
        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $snapshot = Cache::get(self::SNAPSHOT_KEY);

        if (is_array($snapshot)) {
            $snapshot['server_time'] = Carbon::now($timezone)->toIso8601String();
            $snapshot['stream_source'] ??= config('gold_prices.stream_source', 'izko');
            $snapshot['prices'] = MarketGoldPricePresenter::formatCollection($snapshot['prices'] ?? []);

            return $snapshot;
        }

        return [
            'prices' => [],
            'has_gold_base' => null,
            'last_sync_at' => null,
            'server_time' => Carbon::now($timezone)->toIso8601String(),
            'timezone' => $timezone,
            'sync_interval_seconds' => (int) config('gold_prices.sync_interval_seconds', 1),
            'provider' => config('gold_prices.provider'),
            'source' => config('gold_prices.providers.'.config('gold_prices.provider').'.source_label'),
            'stream_source' => config('gold_prices.stream_source', 'izko'),
            'version' => 0,
            'changed' => false,
        ];
    }
}
