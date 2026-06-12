<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_gold_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('metal_type', 20)->default('gold');
            $table->unsignedTinyInteger('karat');
            $table->decimal('buy_price_per_gram', 12, 2);
            $table->decimal('sell_price_per_gram', 12, 2);
            $table->string('source', 100)->nullable();
            $table->timestamp('effective_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['restaurant_id', 'effective_at']);
            $table->index(['restaurant_id', 'metal_type', 'karat']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_gold_prices');
    }
};
