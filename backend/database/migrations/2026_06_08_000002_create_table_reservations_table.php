<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_table_id')->constrained('restaurant_tables')->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('phone', 20);
            $table->dateTime('reserved_at');
            $table->unsignedSmallInteger('duration_minutes')->default(120);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['restaurant_id', 'reserved_at']);
            $table->index(['restaurant_table_id', 'reserved_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_reservations');
    }
};
