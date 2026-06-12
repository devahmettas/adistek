<?php

namespace App\Models;

use App\Enums\JewelryMetalType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryGoldPrice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'metal_type',
        'karat',
        'buy_price_per_gram',
        'sell_price_per_gram',
        'source',
        'effective_at',
    ];

    protected $casts = [
        'metal_type' => JewelryMetalType::class,
        'karat' => 'integer',
        'buy_price_per_gram' => 'decimal:2',
        'sell_price_per_gram' => 'decimal:2',
        'effective_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
