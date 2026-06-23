<?php

namespace App\Http\Requests;

use App\Support\JewelerPermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJewelerStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffId = $this->route('jewelerStaff')?->id ?? $this->route('staff')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('jeweler_staff', 'email')
                    ->where(fn ($query) => $query->where('restaurant_id', $this->user()->id))
                    ->ignore($staffId),
            ],
            'password' => ['nullable', 'string', 'min:5', 'max:255'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function validatedPermissions(?array $current = null): array
    {
        $permissions = JewelerPermissions::normalize($current);

        if ($this->has('permissions') && is_array($this->input('permissions'))) {
            foreach (JewelerPermissions::all() as $permission) {
                if (array_key_exists($permission, $this->input('permissions'))) {
                    $permissions[$permission] = (bool) $this->input("permissions.{$permission}");
                }
            }
        }

        return $permissions;
    }
}
