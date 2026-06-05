<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RestaurantTable extends Model
{
    protected $table = 'restaurant_tables';

    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_restaurant_table')
            ->withPivot('created_at');
    }
}
