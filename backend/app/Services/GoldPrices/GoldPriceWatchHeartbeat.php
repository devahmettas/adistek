<?php

namespace App\Services\GoldPrices;

use Illuminate\Support\Facades\Cache;

class GoldPriceWatchHeartbeat
{
    private const KEY = 'gold_prices.watch_heartbeat';

    public function pulse(): void
    {
        Cache::put(self::KEY, microtime(true), now()->addMinutes(5));
    }

    public function isAlive(float $maxAgeSeconds = 8): bool
    {
        $value = Cache::get(self::KEY);

        if (! is_numeric($value)) {
            return false;
        }

        return microtime(true) - (float) $value <= $maxAgeSeconds;
    }
}
