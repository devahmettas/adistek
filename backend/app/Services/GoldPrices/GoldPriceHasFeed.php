<?php

namespace App\Services\GoldPrices;

use Illuminate\Support\Facades\Cache;

class GoldPriceHasFeed
{
    private const PRICE_KEY = 'gold_prices.current_has';

    private const UPDATED_AT_KEY = 'gold_prices.current_has_updated_at';

    private const SOURCE_KEY = 'gold_prices.current_has_source';

    public function publish(float $has, string $source = 'ozbag'): void
    {
        Cache::put(self::PRICE_KEY, $has, now()->addMinutes(10));
        Cache::put(self::UPDATED_AT_KEY, microtime(true), now()->addMinutes(10));
        Cache::put(self::SOURCE_KEY, $source, now()->addMinutes(10));
    }

    public function get(): ?float
    {
        $value = Cache::get(self::PRICE_KEY);

        return is_numeric($value) ? (float) $value : null;
    }

    public function getSource(): ?string
    {
        $source = Cache::get(self::SOURCE_KEY);

        return is_string($source) ? $source : null;
    }

    public function ageSeconds(): ?float
    {
        $updatedAt = Cache::get(self::UPDATED_AT_KEY);

        if (! is_numeric($updatedAt)) {
            return null;
        }

        return max(0, microtime(true) - (float) $updatedAt);
    }

    public function isFresh(float $maxAgeSeconds = 15): bool
    {
        $age = $this->ageSeconds();

        return $age !== null && $age < $maxAgeSeconds;
    }
}
