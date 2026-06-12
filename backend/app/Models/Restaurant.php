<?php

namespace App\Models;

use App\Enums\BusinessType;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Restaurant extends Authenticatable
{
    use HasApiTokens;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'business_type',
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
        'business_type' => BusinessType::class,
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

    public function jewelryCategories(): HasMany
    {
        return $this->hasMany(JewelryCategory::class);
    }

    public function jewelryProducts(): HasMany
    {
        return $this->hasMany(JewelryProduct::class);
    }

    public function jewelryCustomers(): HasMany
    {
        return $this->hasMany(JewelryCustomer::class);
    }

    public function jewelrySales(): HasMany
    {
        return $this->hasMany(JewelrySale::class);
    }

    public function jewelryRepairs(): HasMany
    {
        return $this->hasMany(JewelryRepair::class);
    }

    public function jewelryStockMovements(): HasMany
    {
        return $this->hasMany(JewelryStockMovement::class);
    }

    public function jewelryGoldPrices(): HasMany
    {
        return $this->hasMany(JewelryGoldPrice::class);
    }

    public function jewelrySettings(): HasOne
    {
        return $this->hasOne(JewelrySetting::class);
    }

    public function isJeweler(): bool
    {
        return $this->business_type === BusinessType::Jeweler;
    }

    public function isRestaurant(): bool
    {
        return $this->business_type === BusinessType::Restaurant
            || $this->business_type === null;
    }
}
