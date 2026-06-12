<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelrySaleItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'quantity',
        'unit_price',
        'weight_gram',
        'labor_cost',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'weight_gram' => 'decimal:3',
        'labor_cost' => 'decimal:2',
        'line_total' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(JewelrySale::class, 'sale_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(JewelryProduct::class, 'product_id');
    }
}
