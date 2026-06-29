<?php

declare(strict_types=1);

$basePath = __DIR__.'/backend';
$envFile = $basePath.'/.env';
$exampleFile = $basePath.'/.env.production.example';

if (! is_file($basePath.'/vendor/autoload.php')) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="tr"><body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px">';
    echo '<h1>Composer bağımlılıkları eksik</h1>';
    echo '<p><code>backend/vendor</code> klasörü sunucuda yok. cPanel Terminal:</p>';
    echo '<pre>cd backend && composer install --no-dev --optimize-autoloader</pre>';
    echo '</body></html>';
    exit;
}

if (is_file($envFile)) {
    http_response_code(200);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="tr"><body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px">';
    echo '<h1>Kurulum tamamlanmış</h1>';
    echo '<p><code>backend/.env</code> zaten mevcut. Giriş deneyebilirsiniz.</p>';
    echo '<p>Güvenlik için <strong>setup.php</strong> dosyasını silin.</p>';
    echo '<p><a href="/">Ana sayfaya git</a> · <a href="/up">Sağlık kontrolü (/up)</a></p>';
    echo '</body></html>';
    exit;
}

if (! is_file($exampleFile)) {
    http_response_code(500);
    exit('backend/.env.production.example bulunamadı.');
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function runArtisan(string $basePath, string $command): array
{
    if (! function_exists('exec')) {
        return ['', 1];
    }

    $php = PHP_BINARY ?: 'php';
    $full = escapeshellarg($php).' '.escapeshellarg($basePath.'/artisan').' '.$command.' 2>&1';
    $output = [];
    $code = 0;
    exec('cd '.escapeshellarg($basePath).' && '.$full, $output, $code);

    return [implode("\n", $output), $code];
}

function ensureWritableDirs(string $basePath): void
{
    foreach ([
        'storage/framework/cache',
        'storage/framework/sessions',
        'storage/framework/views',
        'storage/logs',
        'bootstrap/cache',
    ] as $dir) {
        $path = $basePath.'/'.$dir;
        if (! is_dir($path)) {
            @mkdir($path, 0775, true);
        }
        @chmod($path, 0775);
    }
}

function installEnv(string $basePath, string $exampleFile, string $envFile, array $config): array
{
    $template = file_get_contents($exampleFile);
    if ($template === false) {
        return ['ok' => false, 'errors' => ['Şablon dosyası okunamadı.']];
    }

    $appKey = 'base64:'.base64_encode(random_bytes(32));
    $host = parse_url($config['app_url'], PHP_URL_HOST) ?: '';

    $replacements = [
        'APP_KEY=' => 'APP_KEY='.$appKey,
        'APP_URL=https://adistek.polleyndigitale.com' => 'APP_URL='.$config['app_url'],
        'DB_HOST=localhost' => 'DB_HOST='.$config['db_host'],
        'DB_PORT=3306' => 'DB_PORT='.$config['db_port'],
        'DB_DATABASE=' => 'DB_DATABASE='.$config['db_database'],
        'DB_USERNAME=' => 'DB_USERNAME='.$config['db_username'],
        'DB_PASSWORD=' => 'DB_PASSWORD='.$config['db_password'],
        'SANCTUM_STATEFUL_DOMAINS=adistek.polleyndigitale.com' => 'SANCTUM_STATEFUL_DOMAINS='.$host,
    ];

    $envContent = str_replace(array_keys($replacements), array_values($replacements), $template);

    if (file_put_contents($envFile, $envContent) === false) {
        return ['ok' => false, 'errors' => ['backend/.env yazılamadı. backend/ klasör izinlerini kontrol edin.']];
    }

    ensureWritableDirs($basePath);

    [$migrateOut, $migrateCode] = runArtisan($basePath, 'migrate --force');
    [$linkOut, $linkCode] = runArtisan($basePath, 'storage:link');

    return [
        'ok' => true,
        'errors' => [],
        'migrate' => ['ok' => $migrateCode === 0, 'output' => $migrateOut],
        'storage_link' => ['ok' => $linkCode === 0, 'output' => $linkOut],
    ];
}

$config = [
    'app_url' => 'https://adistek.polleyndigitale.com',
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_database' => '',
    'db_username' => '',
    'db_password' => '',
];

$errors = [];
$result = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $config['app_url'] = trim($_POST['app_url'] ?? $config['app_url']);
    $config['db_host'] = trim($_POST['db_host'] ?? $config['db_host']);
    $config['db_port'] = trim($_POST['db_port'] ?? $config['db_port']);
    $config['db_database'] = trim($_POST['db_database'] ?? $config['db_database']);
    $config['db_username'] = trim($_POST['db_username'] ?? $config['db_username']);
    $config['db_password'] = (string) ($_POST['db_password'] ?? $config['db_password']);

    if ($config['db_database'] === '' || $config['db_username'] === '') {
        $errors[] = 'Veritabanı adı ve kullanıcı adı zorunludur.';
    } else {
        $result = installEnv($basePath, $exampleFile, $envFile, $config);
        $errors = $result['errors'];
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Adistek Kurulum</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #0f172a; }
    label { display: block; font-weight: 600; margin: 16px 0 6px; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
    button { margin-top: 20px; background: #0f766e; color: #fff; border: 0; border-radius: 8px; padding: 12px 16px; font-weight: 600; cursor: pointer; }
    .error { background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .ok { background: #ecfdf5; color: #065f46; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    pre { background: #f8fafc; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px; }
    p.note { color: #475569; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Adistek sunucu kurulumu</h1>
  <p class="note">Git’ten yeniden yükleme sonrası <code>backend/.env</code> oluşturulmalıdır. API 503 hatası bu yüzden çıkar.</p>

  <?php if ($errors !== []): ?>
    <div class="error">
      <?php foreach ($errors as $error): ?>
        <div><?= h($error) ?></div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <?php if ($result !== null && ($result['ok'] ?? false)): ?>
    <div class="ok">
      <strong>Kurulum tamamlandı.</strong>
      <p>Veritabanı: <code><?= h($config['db_database']) ?></code></p>
      <p><a href="/">Ana sayfaya git ve giriş dene</a> · <a href="/up">/up kontrolü</a></p>
      <p><strong>setup.php</strong> dosyasını sunucudan silin.</p>
    </div>
    <h2>Migration</h2>
    <pre><?= h($result['migrate']['output'] ?: ($result['migrate']['ok'] ? 'OK' : 'Çalıştırılamadı')) ?></pre>
    <?php if (! $result['migrate']['ok']): ?>
      <p>Terminal varsa: <code>cd backend && php artisan migrate --force</code></p>
    <?php endif; ?>
    <h2>Storage link</h2>
    <pre><?= h($result['storage_link']['output'] ?: ($result['storage_link']['ok'] ? 'OK' : 'Atlandı / zaten var')) ?></pre>
  <?php else: ?>
    <form method="post">
      <label for="app_url">Site adresi</label>
      <input id="app_url" name="app_url" value="<?= h($config['app_url']) ?>" required />

      <label for="db_host">Veritabanı sunucusu</label>
      <input id="db_host" name="db_host" value="<?= h($config['db_host']) ?>" required />

      <label for="db_port">Port</label>
      <input id="db_port" name="db_port" value="<?= h($config['db_port']) ?>" required />

      <label for="db_database">Veritabanı adı</label>
      <input id="db_database" name="db_database" value="<?= h($config['db_database']) ?>" required />

      <label for="db_username">Kullanıcı adı</label>
      <input id="db_username" name="db_username" value="<?= h($config['db_username']) ?>" required />

      <label for="db_password">Şifre</label>
      <input id="db_password" name="db_password" type="password" value="<?= h($config['db_password']) ?>" />

      <button type="submit">Kurulumu tamamla</button>
    </form>
  <?php endif; ?>
</body>
</html>
