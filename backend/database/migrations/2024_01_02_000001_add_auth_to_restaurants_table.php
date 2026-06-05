<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('products')->truncate();
        DB::table('categories')->truncate();
        DB::table('restaurants')->truncate();
        Schema::enableForeignKeyConstraints();

        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('email')->unique()->after('name');
            $table->string('password')->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['email', 'password']);
        });
    }
};
