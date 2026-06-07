<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->string('table_name');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->unsignedInteger('item_count')->default(0);
            $table->foreignId('assigned_waiter_id')->nullable()->constrained('waiters')->nullOnDelete();
            $table->string('assigned_waiter_name')->nullable();
            $table->timestamp('closed_at')->useCurrent();
            $table->index(['restaurant_id', 'closed_at']);
        });

        Schema::create('table_session_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('category_name')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_session_items');
        Schema::dropIfExists('table_sessions');
    }
};
