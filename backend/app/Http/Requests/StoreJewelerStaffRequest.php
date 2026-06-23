<?php

namespace App\Http\Requests;

use App\Support\JewelerPermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJewelerStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('jeweler_staff', 'email')->where(
                    fn ($query) => $query->where('restaurant_id', $this->user()->id),
                ),
            ],
            'password' => ['required', 'string', 'min:5', 'max:255'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function validatedPermissions(): array
    {
        $permissions = JewelerPermissions::defaultsForNewStaff();

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
