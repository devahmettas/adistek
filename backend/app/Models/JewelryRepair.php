<?php

namespace App\Models;

use App\Enums\JewelryMetalType;
use App\Enums\JewelryRepairStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelryRepair extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'customer_id',
        'repair_number',
        'item_description',
        'metal_type',
        'karat',
        'status',
        'estimated_cost',
        'final_cost',
        'received_at',
        'estimated_delivery_at',
        'completed_at',
        'delivered_at',
        'notes',
    ];

    protected $casts = [
        'metal_type' => JewelryMetalType::class,
        'karat' => 'integer',
        'status' => JewelryRepairStatus::class,
        'estimated_cost' => 'decimal:2',
        'final_cost' => 'decimal:2',
        'received_at' => 'datetime',
        'estimated_delivery_at' => 'datetime',
        'completed_at' => 'datetime',
        'delivered_at' => 'datetime',
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
}
