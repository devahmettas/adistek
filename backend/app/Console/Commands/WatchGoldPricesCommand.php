<?php

namespace App\Console\Commands;

use App\Services\GoldPrices\GoldPriceStreamService;
use App\Services\GoldPrices\GoldPriceSyncService;
use Illuminate\Console\Command;

class WatchGoldPricesCommand extends Command
{
    protected $signature = 'gold-prices:watch';

    protected $description = 'Ozbag canlı has akışını dinler ve İZKO formülüyle senkronize eder';

    public function handle(GoldPriceStreamService $streamService, GoldPriceSyncService $syncService): int
    {
        $this->info('Altın fiyat canlı dinleyici başlatılıyor (Ozbag ↔ İZKO senkron)...');

        try {
            $syncService->sync();
            $this->line('Başlangıç fiyatları yüklendi.');
        } catch (\Throwable $exception) {
            $this->warn('Başlangıç senkronu atlandı: '.$exception->getMessage());
        }

        $streamService->watch();

        return self::SUCCESS;
    }
}
