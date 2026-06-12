<?php

namespace App\Models;

use App\Enums\GoldPriceType;
use Illuminate\Database\Eloquent\Model;

class GoldPriceRecord extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'provider',
        'type',
        'external_key',
        'name',
        'cash_sell_price',
        'card_sell_price',
        'has_gold_base',
        'source',
        'fetched_at',
    ];

    protected $casts = [
        'type' => GoldPriceType::class,
        'cash_sell_price' => 'decimal:2',
        'card_sell_price' => 'decimal:2',
        'has_gold_base' => 'decimal:4',
        'fetched_at' => 'datetime',
        'created_at' => 'datetime',
    ];
}
