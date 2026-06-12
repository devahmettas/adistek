<?php

namespace App\Services\GoldPrices;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoldPriceStreamService
{
    private float $lastIzkoProbeAt = 0;

    public function __construct(
        private readonly GoldPriceSyncService $syncService,
        private readonly GoldPriceLiveStore $liveStore,
    ) {}

    public function watch(): void
    {
        $pollMicros = (int) config('gold_prices.watch_poll_microseconds', 500_000);

        while (true) {
            try {
                $this->tickFromIzko();
            } catch (\Throwable $exception) {
                Log::warning('Altın fiyat dinleyici hatası.', [
                    'error' => $exception->getMessage(),
                ]);
            }

            usleep(max(100_000, $pollMicros));
        }
    }

    public function tickFromIzko(): bool
    {
        $has = $this->fetchHasFromIzko();

        if ($has === null) {
            return false;
        }

        $lastHas = $this->liveStore->getLastHasPrice();
        $threshold = (float) config('gold_prices.has_change_threshold', 0.01);

        if ($lastHas !== null && abs($has - $lastHas) < $threshold) {
            return false;
        }

        $this->syncService->sync();

        return true;
    }

    public function waitForUpdate(int $sinceVersion, int $timeoutSeconds = 25): array
    {
        $deadline = microtime(true) + $timeoutSeconds;
        $pollMicros = (int) config('gold_prices.wait_poll_microseconds', 400_000);

        while (microtime(true) < $deadline) {
            if ($this->liveStore->getVersion() > $sinceVersion) {
                $snapshot = $this->liveStore->getSnapshot();
                $snapshot['changed'] = true;
                $snapshot['timed_out'] = false;

                return $snapshot;
            }

            $this->maybeTickFromIzko();
            usleep(max(100_000, $pollMicros));
        }

        $snapshot = $this->liveStore->getSnapshot();
        $snapshot['changed'] = false;
        $snapshot['timed_out'] = true;

        return $snapshot;
    }

    private function maybeTickFromIzko(): void
    {
        $minIntervalSeconds = (float) config('gold_prices.sync_interval_seconds', 1);

        if (microtime(true) - $this->lastIzkoProbeAt < $minIntervalSeconds) {
            return;
        }

        $this->lastIzkoProbeAt = microtime(true);

        try {
            $this->tickFromIzko();
        } catch (\Throwable $exception) {
            Log::debug('İZKO canlı kontrol başarısız.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function fetchHasFromIzko(): ?float
    {
        $url = config('gold_prices.providers.izko.prices_url');

        $response = Http::timeout(8)
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
