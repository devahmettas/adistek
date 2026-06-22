<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('restaurants')) {
            return;
        }

        Schema::table('restaurants', function (Blueprint $table) {
            if (! Schema::hasColumn('restaurants', 'service_fee')) {
                $table->decimal('service_fee', 10, 2)->default(0)->after('address');
            }

            if (! Schema::hasColumn('restaurants', 'membership_end_date')) {
                $table->date('membership_end_date')->nullable()->after(
                    Schema::hasColumn('restaurants', 'service_fee') ? 'service_fee' : 'address',
                );
            }
        });

        DB::table('restaurants')
            ->whereNull('membership_end_date')
            ->update([
                'membership_end_date' => now()->addDays(30)->toDateString(),
            ]);
    }

    public function down(): void
    {
        // Bu migration yalnızca eksik alanları tamamlar; geri alınmaz.
    }
};
