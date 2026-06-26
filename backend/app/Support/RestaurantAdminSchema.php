<?php

namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestaurantAdminSchema
{
    public static function ensure(): void
    {
        if (! Schema::hasTable('restaurants')) {
            throw new \RuntimeException('restaurants tablosu bulunamadı.');
        }

        try {
            Schema::table('restaurants', function (Blueprint $table) {
                if (! Schema::hasColumn('restaurants', 'business_type')) {
                    $table->string('business_type', 20)->default('jeweler')->after('name');
                }

                if (! Schema::hasColumn('restaurants', 'contact_person')) {
                    $table->string('contact_person')->nullable()->after('slug');
                }

                if (! Schema::hasColumn('restaurants', 'phone')) {
                    $table->string('phone', 30)->nullable()->after('contact_person');
                }

                if (! Schema::hasColumn('restaurants', 'address')) {
                    $table->string('address', 500)->nullable()->after('phone');
                }

                if (! Schema::hasColumn('restaurants', 'feature_order_tracking')) {
                    $table->boolean('feature_order_tracking')->default(false);
                }

                if (! Schema::hasColumn('restaurants', 'feature_qr_menu')) {
                    $table->boolean('feature_qr_menu')->default(false);
                }

                if (! Schema::hasColumn('restaurants', 'feature_reservations')) {
                    $table->boolean('feature_reservations')->default(false);
                }

                if (! Schema::hasColumn('restaurants', 'feature_jeweler_barcode')) {
                    $table->boolean('feature_jeweler_barcode')->default(true);
                }

                if (! Schema::hasColumn('restaurants', 'feature_jeweler_reports')) {
                    $table->boolean('feature_jeweler_reports')->default(true);
                }
            });
        } catch (QueryException $exception) {
            if (! self::isDuplicateColumnError($exception)) {
                throw $exception;
            }
        }

        RestaurantMembershipSchema::ensure();
        self::refreshSchemaCache();
    }

    public static function isReady(): bool
    {
        return Schema::hasColumn('restaurants', 'business_type')
            && Schema::hasColumn('restaurants', 'feature_jeweler_barcode')
            && Schema::hasColumn('restaurants', 'feature_jeweler_reports')
            && RestaurantMembershipSchema::isReady();
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
