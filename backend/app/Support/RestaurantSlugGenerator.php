<?php

namespace App\Support;

use App\Models\Restaurant;
use Illuminate\Support\Str;

class RestaurantSlugGenerator
{
    public static function generate(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $base = $base !== '' ? $base : 'restoran';
        $slug = $base;
        $counter = 1;

        while (
            Restaurant::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
