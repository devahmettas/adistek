<?php

namespace App\Models;

use App\Enums\JewelryCashSessionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelryCashSession extends Model
{
    protected $fillable = [
        'restaurant_id',
        'status',
        'business_date',
        'opened_at',
        'opening_balance',
        'opening_notes',
        'closed_at',
        'expected_balance',
        'counted_balance',
        'cash_difference',
        'session_cash_in',
        'session_cash_out',
        'transaction_count',
        'cash_sale_count',
        'cash_sale_total',
        'cash_purchase_count',
        'cash_purchase_total',
        'closing_notes',
    ];

    protected $casts = [
        'status' => JewelryCashSessionStatus::class,
        'business_date' => 'date',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_balance' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'counted_balance' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'session_cash_in' => 'decimal:2',
        'session_cash_out' => 'decimal:2',
        'cash_sale_total' => 'decimal:2',
        'cash_purchase_total' => 'decimal:2',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function cashTransactions(): HasMany
    {
        return $this->hasMany(JewelryCashTransaction::class, 'cash_session_id');
    }
}
