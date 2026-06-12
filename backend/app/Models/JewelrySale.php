<?php

namespace App\Models;

use App\Enums\JewelryPaymentMethod;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelrySale extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'customer_id',
        'sale_number',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'notes',
        'sold_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'payment_method' => JewelryPaymentMethod::class,
        'sold_at' => 'datetime',
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
        return $this->hasMany(JewelrySaleItem::class, 'sale_id');
    }
}
