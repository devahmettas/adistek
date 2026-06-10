<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->boolean('feature_order_tracking')->default(true)->after('address');
            $table->boolean('feature_qr_menu')->default(true)->after('feature_order_tracking');
            $table->boolean('feature_reservations')->default(true)->after('feature_qr_menu');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'feature_order_tracking',
                'feature_qr_menu',
                'feature_reservations',
            ]);
        });
    }
};
