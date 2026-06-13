# Composer olmadan geliştirme ortamını başlatır.
# Kullanım: powershell -ExecutionPolicy Bypass -File .\start-dev.ps1

Set-Location $PSScriptRoot

Write-Host "Backend + altin fiyat dinleyici baslatiliyor..." -ForegroundColor Cyan
Write-Host "Frontend icin ayri terminalde: cd D:\adistek\frontend && npm run dev" -ForegroundColor Yellow

npx concurrently `
  "php artisan serve" `
  "php artisan gold-prices:watch" `
  --names server,gold `
  --kill-others
