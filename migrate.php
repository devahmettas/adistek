<?php

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

foreach (['migrate.php', 'diag.php', 'cleanup.php'] as $file) {
    $path = __DIR__.'/'.$file;
    if (is_file($path)) {
        @unlink($path);
    }
}

echo "Güvenlik dosyaları silindi.\n";
