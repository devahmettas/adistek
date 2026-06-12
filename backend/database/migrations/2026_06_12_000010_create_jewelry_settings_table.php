<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jewelry_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('default_karat')->default(22);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->string('currency', 3)->default('TRY');
            $table->string('barcode_prefix', 10)->nullable();
            $table->string('company_name')->nullable();
            $table->string('receipt_footer')->nullable();
            $table->boolean('auto_generate_barcode')->default(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jewelry_settings');
    }
};
