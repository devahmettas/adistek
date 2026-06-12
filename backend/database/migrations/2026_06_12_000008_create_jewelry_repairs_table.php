<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_repairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('jewelry_customers')->nullOnDelete();
            $table->string('repair_number', 32);
            $table->text('item_description');
            $table->string('metal_type', 20)->nullable();
            $table->unsignedTinyInteger('karat')->nullable();
            $table->string('status', 20)->default('received');
            $table->decimal('estimated_cost', 12, 2)->nullable();
            $table->decimal('final_cost', 12, 2)->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('estimated_delivery_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'repair_number']);
            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_repairs');
    }
};
