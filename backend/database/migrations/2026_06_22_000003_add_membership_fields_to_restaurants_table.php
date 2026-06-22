<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->decimal('service_fee', 10, 2)->default(0)->after('address');
            $table->date('membership_end_date')->nullable()->after('service_fee');
        });

        DB::table('restaurants')
            ->whereNull('membership_end_date')
            ->update([
                'membership_end_date' => now()->addDays(30)->toDateString(),
            ]);
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['service_fee', 'membership_end_date']);
        });
    }
};
