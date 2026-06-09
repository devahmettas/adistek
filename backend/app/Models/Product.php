<?php

namespace App\Models;

use App\Support\MenuAssetUrl;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'name',
        'name_translations',
        'price',
        'description',
        'description_translations',
        'image_path',
        'calories',
        'allergens',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'name_translations' => 'array',
        'description_translations' => 'array',
        'calories' => 'integer',
        'allergens' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    protected $appends = [
        'image_url',
    ];

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn (): ?string => MenuAssetUrl::resolve($this->image_path));
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(RestaurantTable::class, 'product_restaurant_table')
            ->withPivot('created_at');
    }
}
