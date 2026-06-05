<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->foreignId('viewing_waiter_id')
                ->nullable()
                ->after('occupied_at')
                ->constrained('waiters')
                ->nullOnDelete();
            $table->timestamp('viewing_waiter_at')->nullable()->after('viewing_waiter_id');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('viewing_waiter_id');
            $table->dropColumn('viewing_waiter_at');
        });
    }
};
