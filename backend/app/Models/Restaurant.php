<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Restaurant extends Authenticatable
{
    use HasApiTokens;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'password',
        'menu_tagline',
        'menu_welcome_text',
        'reservation_duration_minutes',
        'reservation_visible_before_minutes',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'password' => 'hashed',
        'reservation_duration_minutes' => 'integer',
        'reservation_visible_before_minutes' => 'integer',
    ];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(RestaurantTable::class);
    }

    public function waiters(): HasMany
    {
        return $this->hasMany(Waiter::class);
    }

    public function kitchenStaff(): HasMany
    {
        return $this->hasMany(KitchenStaff::class);
    }

    public function menuSlides(): HasMany
    {
        return $this->hasMany(MenuSlide::class);
    }
}
