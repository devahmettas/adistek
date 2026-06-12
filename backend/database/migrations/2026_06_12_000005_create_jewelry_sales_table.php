<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('jewelry_customers')->nullOnDelete();
            $table->string('sale_number', 32);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('payment_method', 20)->default('cash');
            $table->text('notes')->nullable();
            $table->timestamp('sold_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'sale_number']);
            $table->index(['restaurant_id', 'sold_at']);
            $table->index(['restaurant_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_sales');
    }
};
