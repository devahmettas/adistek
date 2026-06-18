<?php

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

$basePath = __DIR__.'/backend';

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

if (! is_file($basePath.'/vendor/autoload.php') || ! is_file($basePath.'/.env')) {
    http_response_code(503);
    echo '<!doctype html><html lang="tr"><body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px">';
    echo '<h1>Migration çalıştırılamadı</h1>';
    echo '<p>Önce <code>backend/vendor</code> ve <code>backend/.env</code> dosyalarının sunucuda olduğundan emin olun.</p>';
    echo '</body></html>';
    exit;
}

require $basePath.'/vendor/autoload.php';

/** @var Illuminate\Foundation\Application $app */
$app = require $basePath.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$beforeCounts = Illuminate\Support\Facades\Schema::hasTable('jewelry_stock_counts');
$beforeItems = Illuminate\Support\Facades\Schema::hasTable('jewelry_stock_count_items');

$exitCode = $kernel->call('migrate', ['--force' => true]);
$output = trim((string) $kernel->output());

$kernel->call('optimize:clear');

$afterCounts = Illuminate\Support\Facades\Schema::hasTable('jewelry_stock_counts');
$afterItems = Illuminate\Support\Facades\Schema::hasTable('jewelry_stock_count_items');
$ok = $exitCode === 0 && $afterCounts && $afterItems;

echo '<!doctype html><html lang="tr"><body style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5">';
echo '<h1>Veritabanı güncellemesi</h1>';

if ($ok) {
    echo '<p style="color:#047857"><strong>Başarılı.</strong> Bekleyen migration\'lar uygulandı.</p>';
} else {
    echo '<p style="color:#b91c1c"><strong>Hata.</strong> Migration tamamlanamadı (çıkış kodu: '.h((string) $exitCode).').</p>';
}

echo '<h2>Stok sayım tabloları</h2><ul>';
echo '<li>jewelry_stock_counts: '.($afterCounts ? 'var' : '<strong>yok</strong>').'</li>';
echo '<li>jewelry_stock_count_items: '.($afterItems ? 'var' : '<strong>yok</strong>').'</li>';
echo '</ul>';

if ($beforeCounts !== $afterCounts || $beforeItems !== $afterItems) {
    echo '<p>Yeni stok sayım tabloları oluşturuldu.</p>';
}

if ($output !== '') {
    echo '<h2>Çıktı</h2><pre style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;overflow:auto">'.h($output).'</pre>';
}

echo '<p><a href="/dashboard/jeweler/stock-count">Stok sayım sayfasını dene</a></p>';
echo '<p style="color:#b45309"><strong>Güvenlik:</strong> İşlem bittikten sonra sunucudan <code>migrate.php</code> dosyasını silin.</p>';
echo '</body></html>';
