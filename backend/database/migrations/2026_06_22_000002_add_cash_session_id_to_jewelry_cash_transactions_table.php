<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
            $table->foreignId('cash_session_id')
                ->nullable()
                ->after('restaurant_id')
                ->constrained('jewelry_cash_sessions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cash_session_id');
        });
    }
};
