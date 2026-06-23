<?php

namespace App\Models;

use App\Support\JewelerPermissions;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class JewelerStaff extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'jeweler_staff';

    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'name',
        'email',
        'password',
        'permissions',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'permissions' => 'array',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function hasPermission(string $permission): bool
    {
        $permissions = JewelerPermissions::normalize($this->permissions);

        return (bool) ($permissions[$permission] ?? false);
    }

    public function permissionMap(): array
    {
        return JewelerPermissions::normalize($this->permissions);
    }

    public function toAuthArray(): array
    {
        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'name' => $this->name,
            'email' => $this->email,
            'is_active' => $this->is_active,
            'permissions' => $this->permissionMap(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
