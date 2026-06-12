<?php

namespace App\Models;

use App\Enums\JewelryStockMovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class JewelryStockMovement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'product_id',
        'type',
        'quantity',
        'weight_gram',
        'reference_type',
        'reference_id',
        'notes',
    ];

    protected $casts = [
        'type' => JewelryStockMovementType::class,
        'quantity' => 'integer',
        'weight_gram' => 'decimal:3',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(JewelryProduct::class, 'product_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
