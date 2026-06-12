<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('jewelry_sales')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('jewelry_products')->nullOnDelete();
            $table->string('product_name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('weight_gram', 10, 3)->nullable();
            $table->decimal('labor_cost', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['sale_id']);
            $table->index(['product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_sale_items');
    }
};
