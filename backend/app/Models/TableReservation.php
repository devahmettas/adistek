<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableReservation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'restaurant_table_id',
        'customer_name',
        'phone',
        'guest_count',
        'reserved_at',
        'duration_minutes',
    ];

    protected $casts = [
        'reserved_at' => 'datetime',
        'created_at' => 'datetime',
        'guest_count' => 'integer',
        'duration_minutes' => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'restaurant_table_id');
    }
}
