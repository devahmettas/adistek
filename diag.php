<?php

header('Content-Type: text/plain; charset=utf-8');

$basePath = __DIR__.'/backend';
$checks = [];

function line(string $label, bool $ok, string $detail = ''): void
{
    global $checks;
    $checks[] = [$label, $ok, $detail];
}

line('PHP sürümü >= 8.3', version_compare(PHP_VERSION, '8.3.0', '>='), PHP_VERSION);

foreach (['pdo', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'fileinfo'] as $ext) {
    line("PHP uzantısı: {$ext}", extension_loaded($ext));
}

line('backend/vendor/autoload.php', is_file($basePath.'/vendor/autoload.php'));
line('backend/.env', is_file($basePath.'/.env'));

$appKey = '';
if (is_file($basePath.'/.env')) {
    $env = file_get_contents($basePath.'/.env');
    if (preg_match('/^APP_KEY=(.*)$/m', $env, $m)) {
        $appKey = trim($m[1], " \t\"'");
    }
}
line('APP_KEY dolu', $appKey !== '' && $appKey !== 'base64:', $appKey === '' ? 'boş' : 'tanımlı');

line('storage yazılabilir', is_writable($basePath.'/storage'));
line('bootstrap/cache yazılabilir', is_writable($basePath.'/bootstrap/cache'));

$dbOk = false;
$dbDetail = 'henüz test edilmedi';
if (is_file($basePath.'/.env')) {
    $env = file_get_contents($basePath.'/.env');
    $get = static function (string $key, string $default = '') use ($env): string {
        if (preg_match('/^'.preg_quote($key, '/').'=(.*)$/m', $env, $m)) {
            return trim($m[1], " \t\"'");
        }

        return $default;
    };

    $driver = $get('DB_CONNECTION', 'sqlite');
    if ($driver === 'sqlite') {
        $dbFile = $get('DB_DATABASE', $basePath.'/database/database.sqlite');
        if ($dbFile !== '' && ! str_starts_with($dbFile, '/') && ! preg_match('/^[A-Za-z]:\\\\/', $dbFile)) {
            $dbFile = $basePath.'/database/'.ltrim($dbFile, '/');
        }
        $dbOk = is_file($dbFile);
        $dbDetail = $dbOk ? 'sqlite dosyası var' : "sqlite dosyası yok: {$dbFile}";
    } elseif ($driver === 'mysql') {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $get('DB_HOST', '127.0.0.1'),
                $get('DB_PORT', '3306'),
                $get('DB_DATABASE', '')
            );
            new PDO($dsn, $get('DB_USERNAME', ''), $get('DB_PASSWORD', ''), [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
            $dbOk = true;
            $dbDetail = 'MySQL bağlantısı başarılı';
        } catch (Throwable $e) {
            $dbDetail = $e->getMessage();
        }
    } else {
        $dbDetail = "desteklenmeyen sürücü: {$driver}";
    }
}
line('Veritabanı', $dbOk, $dbDetail);

$laravelOk = false;
$laravelDetail = '';
if (is_file($basePath.'/vendor/autoload.php') && is_file($basePath.'/.env')) {
    try {
        require $basePath.'/vendor/autoload.php';
        $app = require $basePath.'/bootstrap/app.php';
        $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        $laravelOk = true;
        $laravelDetail = 'Laravel bootstrap OK';
    } catch (Throwable $e) {
        $laravelDetail = $e->getMessage();
    }
}
line('Laravel bootstrap', $laravelOk, $laravelDetail);

echo "Adistek sunucu kontrolü\n";
echo str_repeat('=', 40)."\n\n";

$failed = 0;
foreach ($checks as [$label, $ok, $detail]) {
    echo ($ok ? '[OK] ' : '[HATA] ').$label;
    if ($detail !== '') {
        echo ' — '.$detail;
    }
    echo "\n";
    if (! $ok) {
        $failed++;
    }
}

echo "\n";
if ($failed === 0) {
    echo "Tüm kontroller geçti. /api/auth/login çalışmalı.\n";
    echo "Bu dosyayı (diag.php) güvenlik için silin.\n";
} else {
    echo "{$failed} sorun bulundu. Yukarıdaki [HATA] satırlarını düzeltin.\n";
    if (! is_file($basePath.'/.env')) {
        echo "Hızlı çözüm: https://".($_SERVER['HTTP_HOST'] ?? 'alan-adiniz.com')."/setup.php\n";
    } else {
        echo "Tipik çözüm:\n";
        echo "  cd backend\n";
        echo "  php artisan key:generate\n";
        echo "  php artisan migrate --force\n";
    }
}
