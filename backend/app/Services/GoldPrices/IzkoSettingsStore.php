<?php

namespace App\Services\GoldPrices;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IzkoSettingsStore
{
    private const CACHE_KEY = 'gold_prices.izko_settings';

    /**
     * @return array{
     *     settings_by_key: array<string, array{milyem: float, profit: float, name: string}>,
     *     commission_type: string,
     *     commission_value: float,
     *     config_version: int|null,
     *     primary_source: string|null
     * }
     */
    public function get(): array
    {
        $cached = Cache::get(self::CACHE_KEY);

        if (is_array($cached)) {
            return $cached;
        }

        return $this->refresh();
    }

    /**
     * @return array{
     *     settings_by_key: array<string, array{milyem: float, profit: float, name: string}>,
     *     commission_type: string,
     *     commission_value: float,
     *     config_version: int|null,
     *     primary_source: string|null
     * }
     */
    public function refresh(): array
    {
        $url = config('gold_prices.providers.izko.settings_url');

        $response = Http::timeout(10)
            ->acceptJson()
            ->withOptions(['verify' => (bool) config('gold_prices.verify_ssl', true)])
            ->withHeaders(['User-Agent' => 'Adistek-GoldPriceSync/1.0'])
            ->get($url);

        if (! $response->successful()) {
            throw new RuntimeException('İZKO altın ayar API isteği başarısız: '.$response->status());
        }

        $payload = $response->json();

        if (! ($payload['success'] ?? false) || ! is_array($payload['settings'] ?? null)) {
            throw new RuntimeException('İZKO altın ayar API yanıtı geçersiz.');
        }

        $settingsByKey = [];

        foreach ($payload['settings'] as $setting) {
            $key = (string) ($setting['key'] ?? '');

            if ($key === '') {
                continue;
            }

            $settingsByKey[$key] = [
                'milyem' => (float) ($setting['milyem'] ?? 0),
                'profit' => (float) ($setting['profit'] ?? 0),
                'name' => (string) ($setting['name'] ?? $key),
            ];
        }

        $normalized = [
            'settings_by_key' => $settingsByKey,
            'commission_type' => (string) ($payload['commission_type'] ?? 'percent'),
            'commission_value' => (float) ($payload['commission_value'] ?? config('gold_prices.commission_percent', 5)),
            'config_version' => isset($payload['config_version']) ? (int) $payload['config_version'] : null,
            'primary_source' => isset($payload['primary_source']) ? (string) $payload['primary_source'] : null,
        ];

        Cache::put(self::CACHE_KEY, $normalized, now()->addSeconds(
            (int) config('gold_prices.settings_cache_seconds', 60),
        ));

        return $normalized;
    }
}
