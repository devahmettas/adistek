<?php

namespace App\Models;

use App\Enums\JewelryMetalType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryPurchaseItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'purchase_id',
        'product_id',
        'item_description',
        'metal_type',
        'karat',
        'weight_gram',
        'unit_price',
        'quantity',
        'line_total',
    ];

    protected $casts = [
        'metal_type' => JewelryMetalType::class,
        'karat' => 'integer',
        'weight_gram' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
        'line_total' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(JewelryPurchase::class, 'purchase_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(JewelryProduct::class, 'product_id');
    }
}
