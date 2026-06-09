<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('menu_tagline')->nullable()->after('slug');
            $table->text('menu_welcome_text')->nullable()->after('menu_tagline');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['menu_tagline', 'menu_welcome_text']);
        });
    }
};
