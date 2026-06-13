<?php

return [
    'provider' => env('GOLD_PRICE_PROVIDER', 'izko'),

    'commission_percent' => (float) env('GOLD_PRICE_COMMISSION_PERCENT', 5),

    'sync_interval_seconds' => (int) env('GOLD_PRICE_SYNC_INTERVAL', 1),

    'api_poll_seconds' => (float) env('GOLD_PRICE_API_POLL_SECONDS', 1),

    'fallback_sync_seconds' => (float) env('GOLD_PRICE_FALLBACK_SYNC_SECONDS', 5),

    'fallback_snapshot_max_age' => (float) env('GOLD_PRICE_FALLBACK_SNAPSHOT_MAX_AGE', 15),

    'live_cache_seconds' => (float) env('GOLD_PRICE_LIVE_CACHE_SECONDS', 0.3),

    'live_tick_min_seconds' => (float) env('GOLD_PRICE_LIVE_TICK_MIN_SECONDS', 0.2),

    'api_refetch_min_seconds' => (float) env('GOLD_PRICE_API_REFETCH_MIN_SECONDS', 0.5),

    'ozbag_has_max_age_seconds' => (float) env('GOLD_PRICE_OZBAG_HAS_MAX_AGE', 15),

    'has_change_threshold' => (float) env('GOLD_PRICE_HAS_CHANGE_THRESHOLD', 0.0001),

    'derivative_recalc_threshold' => (float) env('GOLD_PRICE_DERIVATIVE_THRESHOLD', 5),

    'settings_cache_seconds' => (int) env('GOLD_PRICE_SETTINGS_CACHE_SECONDS', 60),

    'timezone' => env('GOLD_PRICE_TIMEZONE', 'Europe/Istanbul'),

    'stream_source' => env('GOLD_PRICE_STREAM_SOURCE', 'ozbag'),

    'watch_poll_microseconds' => (int) env('GOLD_PRICE_WATCH_POLL_MICROSECONDS', 500_000),

    'wait_poll_microseconds' => (int) env('GOLD_PRICE_WAIT_POLL_MICROSECONDS', 400_000),

    'verify_ssl' => env('GOLD_PRICE_VERIFY_SSL', env('APP_ENV') === 'production'),

    'providers' => [
        'izko' => [
            'class' => \App\Services\GoldPrices\Providers\IzkoGoldPriceProvider::class,
            'prices_url' => env('IZKO_GOLD_PRICES_URL', 'https://www.izko.org.tr/api/web/v1/gold-prices'),
            'settings_url' => env('IZKO_GOLD_SETTINGS_URL', 'https://www.izko.org.tr/api/web/v1/gold-settings'),
            'source_label' => 'İzmir Kuyumcular Odası',
        ],
    ],
];
