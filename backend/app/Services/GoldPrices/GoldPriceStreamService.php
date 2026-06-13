<?php

namespace App\Services\GoldPrices;

use App\Services\GoldPrices\Streams\OzbagSocketIoClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoldPriceStreamService
{
    private float $lastFallbackSyncAt = 0;

    public function __construct(
        private readonly GoldPriceSyncService $syncService,
        private readonly GoldPriceLiveStore $liveStore,
        private readonly GoldPriceHasFeed $hasFeed,
        private readonly GoldPriceWatchHeartbeat $watchHeartbeat,
    ) {}

    public function watch(): void
    {
        try {
            $this->syncService->sync();
        } catch (\Throwable $exception) {
            Log::warning('Başlangıç İZKO senkronu atlandı.', ['error' => $exception->getMessage()]);
        }

        $this->watchHeartbeat->pulse();

        $onHasPrice = function (float $hasPrice): void {
            $this->watchHeartbeat->pulse();
            $this->hasFeed->publish($hasPrice, 'ozbag');

            try {
                $this->syncService->syncLiveTick($hasPrice);
            } catch (\Throwable $exception) {
                Log::warning('Canlı has/paketli senkronu başarısız.', [
                    'has_price' => $hasPrice,
                    'error' => $exception->getMessage(),
                ]);
            }

            if ($this->syncService->shouldRefreshDerivatives($hasPrice)) {
                try {
                    $this->syncService->sync();
                } catch (\Throwable $exception) {
                    Log::debug('Türev fiyat senkronu başarısız.', ['error' => $exception->getMessage()]);
                }
            }
        };

        $onIdle = function (): void {
            $this->watchHeartbeat->pulse();
        };

        while (true) {
            try {
                (new OzbagSocketIoClient)->run(
                    $onHasPrice,
                    $onIdle,
                    function (\Throwable $exception): void {
                        Log::warning('Ozbag akışı kesildi, yeniden bağlanılıyor.', [
                            'error' => $exception->getMessage(),
                        ]);
                    },
                );
            } catch (\Throwable $exception) {
                Log::warning('Ozbag dinleyici hatası, API yedek moduna geçiliyor.', [
                    'error' => $exception->getMessage(),
                ]);
                $this->pollApiLoop();
            }

            sleep(1);
        }
    }

    public function isWatchAlive(): bool
    {
        return $this->watchHeartbeat->isAlive();
    }

    public function refreshSnapshotIfStale(): void
    {
        $interval = (float) config('gold_prices.fallback_sync_seconds', 5);
        $maxAge = (float) config('gold_prices.fallback_snapshot_max_age', 15);

        if ($this->watchHeartbeat->isAlive()) {
            return;
        }

        $snapshotAge = $this->liveStore->snapshotAgeSeconds();

        if ($snapshotAge !== null && $snapshotAge < $maxAge) {
            return;
        }

        if (microtime(true) - $this->lastFallbackSyncAt < $interval) {
            return;
        }

        if (! Cache::add('gold_prices.refresh_lock', true, 5)) {
            return;
        }

        $this->lastFallbackSyncAt = microtime(true);

        try {
            $this->syncService->sync();
        } catch (\Throwable $exception) {
            Log::debug('Yedek fiyat senkronu başarısız.', ['error' => $exception->getMessage()]);
        } finally {
            Cache::forget('gold_prices.refresh_lock');
        }
    }

    public function waitForUpdate(int $sinceVersion, int $timeoutSeconds = 25): array
    {
        $deadline = microtime(true) + $timeoutSeconds;

        while (microtime(true) < $deadline) {
            if ($this->liveStore->getVersion() > $sinceVersion) {
                $snapshot = $this->liveStore->getSnapshot();
                $snapshot['changed'] = true;
                $snapshot['timed_out'] = false;

                return $snapshot;
            }

            $this->refreshSnapshotIfStale();
            usleep(200_000);
        }

        $snapshot = $this->liveStore->getSnapshot();
        $snapshot['changed'] = false;
        $snapshot['timed_out'] = true;

        return $snapshot;
    }

    private function pollApiLoop(): void
    {
        $deadline = time() + 30;
        $interval = (float) config('gold_prices.fallback_sync_seconds', 5);
        $lastSync = 0.0;

        while (time() < $deadline) {
            $this->watchHeartbeat->pulse();

            if (microtime(true) - $lastSync >= $interval) {
                try {
                    $has = $this->fetchHasFromIzko();

                    if ($has !== null) {
                        $this->hasFeed->publish($has, 'izko_api');
                        $this->syncService->syncLiveTick($has);

                        if ($this->syncService->shouldRefreshDerivatives($has)) {
                            $this->syncService->sync();
                        }
                    }
                } catch (\Throwable $exception) {
                    Log::debug('Yedek API senkronu başarısız.', ['error' => $exception->getMessage()]);
                }

                $lastSync = microtime(true);
            }

            usleep(500_000);
        }
    }

    private function fetchHasFromIzko(): ?float
    {
        $url = config('gold_prices.providers.izko.prices_url');

        $response = Http::timeout(5)
            ->acceptJson()
            ->withOptions(['verify' => (bool) config('gold_prices.verify_ssl', true)])
            ->withHeaders(['User-Agent' => 'Adistek-GoldWatcher/1.0'])
            ->get($url);

        if (! $response->successful()) {
            return null;
        }

        $payload = $response->json();
        $has = $payload['has_altin_price'] ?? null;

        return is_numeric($has) ? (float) $has : null;
    }
}
