#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Backend bağımlılıkları"
cd "$ROOT/backend"
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "backend/.env oluşturuldu — veritabanı bilgilerini düzenleyin."
fi
php composer.phar install --no-dev --optimize-autoloader 2>/dev/null || composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan optimize:clear
php artisan storage:link || true
chmod -R 775 storage bootstrap/cache || true

echo "==> Frontend build"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> Tamamlandı"
echo "Kontrol: siteyi tarayıcıda açıp giriş yapın."
