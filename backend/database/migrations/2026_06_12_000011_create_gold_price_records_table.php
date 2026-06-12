<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gold_price_records', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50);
            $table->string('type', 30);
            $table->string('external_key', 50);
            $table->string('name');
            $table->decimal('cash_sell_price', 12, 2);
            $table->decimal('card_sell_price', 12, 2)->nullable();
            $table->decimal('has_gold_base', 12, 4)->nullable();
            $table->string('source', 100)->nullable();
            $table->timestamp('fetched_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['type', 'fetched_at']);
            $table->index(['provider', 'fetched_at']);
            $table->index(['fetched_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gold_price_records');
    }
};
