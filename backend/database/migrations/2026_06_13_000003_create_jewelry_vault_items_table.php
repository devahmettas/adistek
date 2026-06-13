<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_vault_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('item_key', 64);
            $table->string('section', 32);
            $table->string('label');
            $table->string('unit', 16)->default('adet');
            $table->decimal('quantity', 14, 3)->default(0);
            $table->decimal('unit_value', 14, 2)->nullable();
            $table->string('gold_price_type', 32)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['restaurant_id', 'item_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_vault_items');
    }
};
