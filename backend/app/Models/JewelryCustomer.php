<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JewelryCustomer extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'name',
        'phone',
        'email',
        'tc_identity',
        'address',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(JewelrySale::class, 'customer_id');
    }

    public function repairs(): HasMany
    {
        return $this->hasMany(JewelryRepair::class, 'customer_id');
    }
}
