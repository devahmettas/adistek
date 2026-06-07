<?php

use App\Models\Restaurant;
use App\Support\RestaurantSlugGenerator;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
        });

        Restaurant::query()->each(function (Restaurant $restaurant) {
            $restaurant->update([
                'slug' => RestaurantSlugGenerator::generate($restaurant->name, $restaurant->id),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
