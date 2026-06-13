<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelryPurchase extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'customer_id',
        'purchase_number',
        'subtotal',
        'total',
        'payment_method',
        'notes',
        'purchased_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
        'purchased_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(JewelryCustomer::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(JewelryPurchaseItem::class, 'purchase_id');
    }

    public function cashTransaction(): HasMany
    {
        return $this->hasMany(JewelryCashTransaction::class, 'purchase_id');
    }
}
