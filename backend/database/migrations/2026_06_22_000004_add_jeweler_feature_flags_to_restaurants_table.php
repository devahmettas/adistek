<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->boolean('feature_jeweler_barcode')->default(true)->after('feature_reservations');
            $table->boolean('feature_jeweler_reports')->default(true)->after('feature_jeweler_barcode');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['feature_jeweler_barcode', 'feature_jeweler_reports']);
        });
    }
};
