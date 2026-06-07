<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKitchenStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $kitchenStaff = $this->route('kitchenStaff');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('kitchen_staff', 'email')
                    ->where(fn ($query) => $query->where('restaurant_id', $this->user()->id))
                    ->ignore($kitchenStaff?->id),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:5', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
