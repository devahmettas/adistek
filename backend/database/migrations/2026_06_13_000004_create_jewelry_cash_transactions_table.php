<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('type', 8);
            $table->string('source', 16)->default('manual');
            $table->decimal('amount', 14, 2);
            $table->text('notes')->nullable();
            $table->foreignId('sale_id')->nullable()->constrained('jewelry_sales')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['restaurant_id', 'created_at']);
            $table->index(['restaurant_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_cash_transactions');
    }
};
