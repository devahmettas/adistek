<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('jewelry_cash_transactions', 'purchase_id')) {
            Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
                $table->foreignId('purchase_id')
                    ->nullable()
                    ->after('sale_id')
                    ->constrained('jewelry_purchases')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('jewelry_cash_transactions', 'purchase_id')) {
            Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
                $table->dropConstrainedForeignId('purchase_id');
            });
        }
    }
};
