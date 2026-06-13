<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jewelry_settings', function (Blueprint $table) {
            $table->decimal('card_commission_rate', 5, 2)->default(0)->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('jewelry_settings', function (Blueprint $table) {
            $table->dropColumn('card_commission_rate');
        });
    }
};
