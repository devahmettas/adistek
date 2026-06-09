<?php

return [
    'enabled' => env('MENU_TRANSLATION_ENABLED', true),

    'source_lang' => 'tr',

    'cache_ttl' => (int) env('MENU_TRANSLATION_CACHE_TTL', 60 * 60 * 24 * 7),

    'request_timeout' => (int) env('MENU_TRANSLATION_TIMEOUT', 6),

    'verify_ssl' => env('MENU_TRANSLATION_VERIFY_SSL', env('APP_ENV', 'production') === 'production'),

    'mymemory_email' => env('MYMEMORY_EMAIL'),
];
