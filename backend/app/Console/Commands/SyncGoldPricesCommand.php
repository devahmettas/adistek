<?php

namespace App\Console\Commands;

use App\Repositories\GoldPriceRecordRepository;
use App\Services\GoldPrices\GoldPriceSyncService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Throwable;

class SyncGoldPricesCommand extends Command
{
    protected $signature = 'gold-prices:sync {--provider= : Altın fiyat sağlayıcısı}';

    protected $description = 'Harici kaynaktan altın fiyatlarını çekip veritabanına kaydeder';

    public function handle(
        GoldPriceSyncService $syncService,
        GoldPriceRecordRepository $repository,
    ): int {
        try {
            $sync = $syncService->sync($this->option('provider'));
            $result = $sync['result'];

            $this->info(sprintf(
                '%d tür kontrol edildi, %d kayıt güncellendi. Has altın: %s',
                count($result->quotes),
                $sync['stored_count'],
                $result->hasGoldBase !== null ? number_format($result->hasGoldBase, 2, ',', '.') : '—',
            ));

            $pruned = $repository->pruneOlderThan(Carbon::now()->subDays(90));

            if ($pruned > 0) {
                $this->line("90 günden eski {$pruned} kayıt temizlendi.");
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('Altın fiyat senkronizasyonu başarısız: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
