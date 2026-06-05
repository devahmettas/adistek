<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'name',
        'price',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
