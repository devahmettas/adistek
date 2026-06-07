<?php

namespace App\Models;

use App\Enums\KitchenStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RestaurantTable extends Model
{
    protected $table = 'restaurant_tables';

    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'name',
        'qr_token',
        'status',
        'occupied_at',
        'viewing_waiter_id',
        'viewing_waiter_at',
        'assigned_waiter_id',
        'assigned_at',
    ];

    protected $appends = [
        'total_amount',
        'occupied_minutes',
        'viewing_waiter_name',
        'assigned_waiter_name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'occupied_at' => 'datetime',
        'viewing_waiter_at' => 'datetime',
        'assigned_at' => 'datetime',
        'status' => \App\Enums\TableStatus::class,
    ];

    protected function totalAmount(): Attribute
    {
        return Attribute::get(function (): string {
            if (! $this->relationLoaded('products')) {
                return '0.00';
            }

            $total = $this->products
                ->filter(fn (Product $product) => ($product->pivot->kitchen_status ?? null) !== KitchenStatus::Cancelled->value)
                ->sum(function (Product $product) {
                    $quantity = $product->pivot->quantity ?? 1;

                    return (float) $product->price * $quantity;
                });

            return number_format($total, 2, '.', '');
        });
    }

    protected function occupiedMinutes(): Attribute
    {
        return Attribute::get(function (): ?int {
            if (! $this->occupied_at) {
                return null;
            }

            return (int) $this->occupied_at->diffInMinutes(now());
        });
    }

    protected function viewingWaiterName(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->relationLoaded('viewingWaiter')) {
                return $this->viewingWaiter?->name;
            }

            if (! $this->viewing_waiter_id) {
                return null;
            }

            return Waiter::query()->whereKey($this->viewing_waiter_id)->value('name');
        });
    }

    protected function assignedWaiterName(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->relationLoaded('assignedWaiter')) {
                return $this->assignedWaiter?->name;
            }

            if (! $this->assigned_waiter_id) {
                return null;
            }

            return Waiter::query()->whereKey($this->assigned_waiter_id)->value('name');
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_restaurant_table')
            ->withPivot(['id', 'quantity', 'note', 'kitchen_status', 'ready_at', 'created_at'])
            ->orderByPivot('created_at');
    }

    public function viewingWaiter(): BelongsTo
    {
        return $this->belongsTo(Waiter::class, 'viewing_waiter_id');
    }

    public function assignedWaiter(): BelongsTo
    {
        return $this->belongsTo(Waiter::class, 'assigned_waiter_id');
    }
}
