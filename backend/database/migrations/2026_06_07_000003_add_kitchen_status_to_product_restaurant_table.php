<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->string('kitchen_status')->default('pending')->after('note');
            $table->timestamp('ready_at')->nullable()->after('kitchen_status');
        });
    }

    public function down(): void
    {
        Schema::table('product_restaurant_table', function (Blueprint $table) {
            $table->dropColumn(['kitchen_status', 'ready_at']);
        });
    }
};
