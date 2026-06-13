<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryVaultItem extends Model
{
    protected $fillable = [
        'restaurant_id',
        'item_key',
        'section',
        'label',
        'unit',
        'quantity',
        'unit_value',
        'gold_price_type',
        'notes',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_value' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
