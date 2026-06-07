<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->foreignId('assigned_waiter_id')
                ->nullable()
                ->after('viewing_waiter_at')
                ->constrained('waiters')
                ->nullOnDelete();
            $table->timestamp('assigned_at')->nullable()->after('assigned_waiter_id');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_waiter_id');
            $table->dropColumn('assigned_at');
        });
    }
};
