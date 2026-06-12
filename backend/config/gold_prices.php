<?php

return [
    'provider' => env('GOLD_PRICE_PROVIDER', 'izko'),

    'commission_percent' => (float) env('GOLD_PRICE_COMMISSION_PERCENT', 5),

    'sync_interval_seconds' => (int) env('GOLD_PRICE_SYNC_INTERVAL', 1),

    'has_change_threshold' => (float) env('GOLD_PRICE_HAS_CHANGE_THRESHOLD', 0.01),

    'timezone' => env('GOLD_PRICE_TIMEZONE', 'Europe/Istanbul'),

    'stream_source' => env('GOLD_PRICE_STREAM_SOURCE', 'izko'),

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
