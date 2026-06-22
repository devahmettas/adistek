<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestaurantMembershipSchema
{
    public static function ensure(): void
    {
        if (! Schema::hasTable('restaurants')) {
            throw new \RuntimeException('restaurants tablosu bulunamadı.');
        }

        if (self::isReady()) {
            return;
        }

        try {
            Schema::table('restaurants', function (Blueprint $table) {
                if (! Schema::hasColumn('restaurants', 'service_fee')) {
                    $table->decimal('service_fee', 10, 2)->default(0);
                }

                if (! Schema::hasColumn('restaurants', 'membership_end_date')) {
                    $table->date('membership_end_date')->nullable();
                }
            });
        } catch (QueryException $exception) {
            if (! self::isDuplicateColumnError($exception)) {
                throw $exception;
            }
        }

        self::refreshSchemaCache();

        if (! self::isReady()) {
            throw new \RuntimeException(
                'Üyelik alanları oluşturulamadı. Sunucuda php artisan migrate --force çalıştırın.',
            );
        }

        DB::table('restaurants')
            ->whereNull('membership_end_date')
            ->update([
                'membership_end_date' => now()->addDays(30)->toDateString(),
            ]);
    }

    public static function isReady(): bool
    {
        return Schema::hasColumn('restaurants', 'membership_end_date')
            && Schema::hasColumn('restaurants', 'service_fee');
    }

    private static function refreshSchemaCache(): void
    {
        $connection = Schema::getConnection();
        $connection->forgetRecordModificationState();

        if (method_exists($connection, 'disconnect')) {
            $connection->disconnect();
        }

        $connection->reconnect();
    }

    private static function isDuplicateColumnError(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'duplicate column')
            || str_contains($message, 'already exists');
    }
}
