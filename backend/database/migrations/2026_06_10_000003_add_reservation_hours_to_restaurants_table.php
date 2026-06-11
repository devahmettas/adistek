<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('reservation_start_time', 5)->default('10:00')->after('reservation_visible_before_minutes');
            $table->string('reservation_end_time', 5)->default('23:00')->after('reservation_start_time');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['reservation_start_time', 'reservation_end_time']);
        });
    }
};
