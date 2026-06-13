<?php

namespace App\Models;

use App\Enums\JewelryCashTransactionSource;
use App\Enums\JewelryCashTransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryCashTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'type',
        'source',
        'amount',
        'notes',
        'sale_id',
        'purchase_id',
        'created_at',
    ];

    protected $casts = [
        'type' => JewelryCashTransactionType::class,
        'source' => JewelryCashTransactionSource::class,
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(JewelrySale::class, 'sale_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(JewelryPurchase::class, 'purchase_id');
    }
}
