<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JewelrySetting extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'default_karat',
        'tax_rate',
        'currency',
        'barcode_prefix',
        'company_name',
        'receipt_footer',
        'auto_generate_barcode',
    ];

    protected $casts = [
        'default_karat' => 'integer',
        'tax_rate' => 'decimal:2',
        'auto_generate_barcode' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
