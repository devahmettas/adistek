<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('jewelry_categories')->nullOnDelete();
            $table->string('name');
            $table->string('sku', 64)->nullable();
            $table->string('barcode', 64)->nullable();
            $table->string('metal_type', 20)->default('gold');
            $table->unsignedTinyInteger('karat')->nullable();
            $table->decimal('weight_gram', 10, 3)->default(0);
            $table->string('stone_type', 100)->nullable();
            $table->decimal('stone_carat', 8, 2)->nullable();
            $table->decimal('purchase_price', 12, 2)->default(0);
            $table->decimal('labor_cost', 12, 2)->default(0);
            $table->decimal('sale_price', 12, 2)->default(0);
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'barcode']);
            $table->unique(['restaurant_id', 'sku']);
            $table->index(['restaurant_id', 'is_active']);
            $table->index(['restaurant_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_products');
    }
};
