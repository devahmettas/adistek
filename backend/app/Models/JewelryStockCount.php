<?php

namespace App\Models;

use App\Enums\JewelryStockCountStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelryStockCount extends Model
{
    protected $fillable = [
        'restaurant_id',
        'status',
        'expected_cash_balance',
        'counted_cash_balance',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'status' => JewelryStockCountStatus::class,
        'expected_cash_balance' => 'decimal:2',
        'counted_cash_balance' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(JewelryStockCountItem::class, 'stock_count_id');
    }
}
