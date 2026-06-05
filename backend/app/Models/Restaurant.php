<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Restaurant extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
