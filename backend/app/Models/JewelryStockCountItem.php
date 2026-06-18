<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryStockCountItem extends Model
{
    protected $fillable = [
        'stock_count_id',
        'product_id',
        'name',
        'barcode',
        'category_name',
        'count_mode',
        'entry_type',
        'expected_quantity',
        'counted_quantity',
        'expected_weight_gram',
        'counted_weight_gram',
    ];

    protected $casts = [
        'stock_count_id' => 'integer',
        'product_id' => 'integer',
        'expected_quantity' => 'integer',
        'counted_quantity' => 'integer',
        'expected_weight_gram' => 'decimal:3',
        'counted_weight_gram' => 'decimal:3',
    ];

    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(JewelryStockCount::class, 'stock_count_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(JewelryProduct::class, 'product_id');
    }
}
