<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryInventoryLot extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'purchase_item_id',
        'quantity_initial',
        'quantity_remaining',
        'unit_cost',
        'purchased_at',
    ];

    protected $casts = [
        'quantity_initial' => 'integer',
        'quantity_remaining' => 'integer',
        'unit_cost' => 'decimal:2',
        'purchased_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(JewelryProduct::class, 'product_id');
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(JewelryPurchaseItem::class, 'purchase_item_id');
    }
}
