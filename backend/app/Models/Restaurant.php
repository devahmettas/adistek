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
        'contact_person',
        'phone',
        'address',
        'email',
        'password',
        'feature_order_tracking',
        'feature_qr_menu',
        'feature_reservations',
        'menu_tagline',
        'menu_welcome_text',
        'reservation_duration_minutes',
        'reservation_visible_before_minutes',
        'reservation_start_time',
        'reservation_end_time',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'password' => 'hashed',
        'reservation_duration_minutes' => 'integer',
        'reservation_visible_before_minutes' => 'integer',
        'feature_order_tracking' => 'boolean',
        'feature_qr_menu' => 'boolean',
        'feature_reservations' => 'boolean',
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
