<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableSession extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'restaurant_table_id',
        'table_name',
        'total_amount',
        'payment_method',
        'is_partial',
        'item_count',
        'assigned_waiter_id',
        'assigned_waiter_name',
        'closed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'payment_method' => \App\Enums\PaymentMethod::class,
        'closed_at' => 'datetime',
        'is_partial' => 'boolean',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function restaurantTable(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TableSessionItem::class);
    }
}
