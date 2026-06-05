<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'status',
        'occupied_at',
    ];

    protected $appends = [
        'total_amount',
        'occupied_minutes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'occupied_at' => 'datetime',
        'status' => \App\Enums\TableStatus::class,
    ];

    protected function totalAmount(): Attribute
    {
        return Attribute::get(function (): string {
            if (! $this->relationLoaded('products')) {
                return '0.00';
            }

            $total = $this->products->sum(function (Product $product) {
                $quantity = $product->pivot->quantity ?? 1;

                return (float) $product->price * $quantity;
            });

            return number_format($total, 2, '.', '');
        });
    }

    protected function occupiedMinutes(): Attribute
    {
        return Attribute::get(function (): ?int {
            if (! $this->occupied_at) {
                return null;
            }

            return (int) $this->occupied_at->diffInMinutes(now());
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_restaurant_table')
            ->withPivot(['quantity', 'note', 'created_at']);
    }
}
