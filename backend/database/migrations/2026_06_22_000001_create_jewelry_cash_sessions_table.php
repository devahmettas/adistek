<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('status', 16)->default('open');
            $table->date('business_date');
            $table->timestamp('opened_at');
            $table->decimal('opening_balance', 14, 2)->default(0);
            $table->text('opening_notes')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->decimal('expected_balance', 14, 2)->nullable();
            $table->decimal('counted_balance', 14, 2)->nullable();
            $table->decimal('cash_difference', 14, 2)->nullable();
            $table->decimal('session_cash_in', 14, 2)->default(0);
            $table->decimal('session_cash_out', 14, 2)->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->unsignedInteger('cash_sale_count')->default(0);
            $table->decimal('cash_sale_total', 14, 2)->default(0);
            $table->unsignedInteger('cash_purchase_count')->default(0);
            $table->decimal('cash_purchase_total', 14, 2)->default(0);
            $table->text('closing_notes')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'business_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_cash_sessions');
    }
};
