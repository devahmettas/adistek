<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->index('restaurant_table_id', 'prt_restaurant_table_id_index');
            $table->index('product_id', 'prt_product_id_index');
        });

        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->dropUnique(['restaurant_table_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->unique(['restaurant_table_id', 'product_id']);
        });

        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->dropIndex('prt_restaurant_table_id_index');
            $table->dropIndex('prt_product_id_index');
        });
    }
};
