<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

foreach (['migrate.php', 'diag.php', 'cleanup.php'] as $legacySetupFile) {
    $legacySetupPath = __DIR__.'/'.$legacySetupFile;
    if (is_file($legacySetupPath)) {
        @unlink($legacySetupPath);
    }
}

$basePath = __DIR__.'/backend';
$autoload = $basePath.'/vendor/autoload.php';
$envFile = $basePath.'/.env';

if (! is_file($autoload)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Composer bağımlılıkları sunucuda yok.',
        'fix' => 'SSH/terminal: cd backend && composer install --no-dev --optimize-autoloader',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (! is_file($envFile)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'backend/.env dosyası bulunamadı.',
        'fix' => 'Tarayıcıda /setup.php adresini açıp veritabanı bilgilerini girin.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (file_exists($maintenance = $basePath.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $autoload;

try {
    /** @var Application $app */
    $app = require_once $basePath.'/bootstrap/app.php';
    $app->handleRequest(Request::capture());
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Laravel başlatılamadı.',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()).':'.$e->getLine(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
