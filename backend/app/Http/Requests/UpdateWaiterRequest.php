<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWaiterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $waiter = $this->route('waiter');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('waiters', 'email')
                    ->where(fn ($query) => $query->where('restaurant_id', $this->user()->id))
                    ->ignore($waiter?->id),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:5', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
