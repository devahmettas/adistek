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
        'service_fee',
        'membership_end_date',
        'email',
        'password',
        'feature_order_tracking',
        'feature_qr_menu',
        'feature_reservations',
        'feature_jeweler_barcode',
        'feature_jeweler_reports',
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

    protected $appends = [
        'membership_days_remaining',
        'membership_expired',
    ];

    protected $casts = [
        'business_type' => BusinessType::class,
        'created_at' => 'datetime',
        'membership_end_date' => 'date',
        'service_fee' => 'decimal:2',
        'password' => 'hashed',
        'reservation_duration_minutes' => 'integer',
        'reservation_visible_before_minutes' => 'integer',
        'feature_order_tracking' => 'boolean',
        'feature_qr_menu' => 'boolean',
        'feature_reservations' => 'boolean',
        'feature_jeweler_barcode' => 'boolean',
        'feature_jeweler_reports' => 'boolean',
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

    public function isMembershipExpired(): bool
    {
        if (! $this->membership_end_date) {
            return false;
        }

        return $this->membership_end_date->endOfDay()->isPast();
    }

    public function getMembershipDaysRemainingAttribute(): int
    {
        if (! $this->membership_end_date) {
            return 0;
        }

        return max(0, (int) now()->startOfDay()->diffInDays($this->membership_end_date->startOfDay(), false));
    }

    public function getMembershipExpiredAttribute(): bool
    {
        return $this->isMembershipExpired();
    }

    public function adjustMembership(int $days): void
    {
        if ($days === 0) {
            return;
        }

        if ($days > 0) {
            $base = $this->membership_end_date && ! $this->isMembershipExpired()
                ? $this->membership_end_date->copy()->startOfDay()
                : now()->startOfDay();

            $this->membership_end_date = $base->addDays($days);
            $this->save();

            return;
        }

        $reduceBy = abs($days);

        if (! $this->membership_end_date) {
            $this->membership_end_date = now()->startOfDay()->subDay();
            $this->save();

            return;
        }

        $newEnd = $this->membership_end_date->copy()->startOfDay()->subDays($reduceBy);
        $today = now()->startOfDay();

        $this->membership_end_date = $newEnd->lt($today) ? $today->copy()->subDay() : $newEnd;
        $this->save();
    }

    /** @deprecated Use adjustMembership() */
    public function extendMembership(int $days): void
    {
        $this->adjustMembership($days);
    }
}
