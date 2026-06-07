<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable()->unique()->after('name');
        });

        DB::table('restaurant_tables')->orderBy('id')->each(function ($row) {
            DB::table('restaurant_tables')
                ->where('id', $row->id)
                ->update(['qr_token' => (string) Str::uuid()]);
        });

        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
