<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('jewelry_customers')->nullOnDelete();
            $table->string('purchase_number', 32);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_method', 20)->default('cash');
            $table->text('notes')->nullable();
            $table->timestamp('purchased_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'purchase_number']);
            $table->index(['restaurant_id', 'purchased_at']);
            $table->index(['restaurant_id', 'customer_id']);
        });

        Schema::create('jewelry_purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('jewelry_purchases')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('jewelry_products')->nullOnDelete();
            $table->string('item_description');
            $table->string('metal_type', 20)->default('gold');
            $table->unsignedTinyInteger('karat')->nullable();
            $table->decimal('weight_gram', 10, 3)->default(0);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['purchase_id']);
            $table->index(['product_id']);
        });

        Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
            $table->foreignId('purchase_id')->nullable()->after('sale_id')->constrained('jewelry_purchases')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('jewelry_cash_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purchase_id');
        });

        Schema::dropIfExists('jewelry_purchase_items');
        Schema::dropIfExists('jewelry_purchases');
    }
};
