<?php

namespace App\Console\Commands;

use App\Support\RestaurantMembershipSchema;
use Illuminate\Console\Command;

class EnsureRestaurantMembershipSchema extends Command
{
    protected $signature = 'restaurant:ensure-membership-schema';

    protected $description = 'restaurants tablosuna üyelik alanlarını ekler (canlı sunucu için)';

    public function handle(): int
    {
        try {
            RestaurantMembershipSchema::ensure();
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if (RestaurantMembershipSchema::isReady()) {
            $this->info('Üyelik alanları hazır.');

            return self::SUCCESS;
        }

        $this->error('Üyelik alanları doğrulanamadı.');

        return self::FAILURE;
    }
}
