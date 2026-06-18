<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_stock_counts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('draft');
            $table->decimal('expected_cash_balance', 14, 2)->default(0);
            $table->decimal('counted_cash_balance', 14, 2)->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'started_at']);
        });

        Schema::create('jewelry_stock_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_count_id')->constrained('jewelry_stock_counts')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('jewelry_products')->nullOnDelete();
            $table->string('name');
            $table->string('barcode', 64)->nullable();
            $table->string('category_name')->nullable();
            $table->string('count_mode', 20);
            $table->string('entry_type', 20)->default('quantity');
            $table->integer('expected_quantity')->default(0);
            $table->integer('counted_quantity')->default(0);
            $table->decimal('expected_weight_gram', 10, 3)->nullable();
            $table->decimal('counted_weight_gram', 10, 3)->nullable();
            $table->timestamps();

            $table->index(['stock_count_id', 'product_id']);
            $table->index(['stock_count_id', 'barcode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_stock_count_items');
        Schema::dropIfExists('jewelry_stock_counts');
    }
};
