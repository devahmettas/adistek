<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jewelry_products', function (Blueprint $table) {
            $table->decimal('profit_rate', 5, 2)->default(0)->after('labor_cost');
            $table->boolean('is_manual_price')->default(false)->after('sale_price');
        });
    }

    public function down(): void
    {
        Schema::table('jewelry_products', function (Blueprint $table) {
            $table->dropColumn(['profit_rate', 'is_manual_price']);
        });
    }
};
