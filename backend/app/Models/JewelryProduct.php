<?php

namespace App\Models;

use App\Enums\JewelryMetalType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelryProduct extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'name',
        'sku',
        'barcode',
        'metal_type',
        'karat',
        'weight_gram',
        'stone_type',
        'stone_carat',
        'purchase_price',
        'labor_cost',
        'profit_rate',
        'sale_price',
        'is_manual_price',
        'stock_quantity',
        'description',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'metal_type' => JewelryMetalType::class,
        'karat' => 'integer',
        'weight_gram' => 'decimal:3',
        'stone_carat' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'profit_rate' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'is_manual_price' => 'boolean',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(JewelryCategory::class, 'category_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(JewelryStockMovement::class, 'product_id');
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(JewelrySaleItem::class, 'product_id');
    }
}
