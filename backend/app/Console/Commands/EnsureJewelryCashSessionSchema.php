<?php

namespace App\Console\Commands;

use App\Support\JewelryCashSessionSchema;
use Illuminate\Console\Command;

class EnsureJewelryCashSessionSchema extends Command
{
    protected $signature = 'jeweler:ensure-cash-session-schema';

    protected $description = 'Kasa oturumu tablolarını oluşturur (canlı sunucu için)';

    public function handle(): int
    {
        try {
            JewelryCashSessionSchema::ensure();
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if (JewelryCashSessionSchema::isReady()) {
            $this->info('Kasa oturumu tabloları hazır.');

            return self::SUCCESS;
        }

        $this->error('Kasa oturumu tabloları doğrulanamadı. php artisan migrate --force deneyin.');

        return self::FAILURE;
    }
}
