<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWaiterRequest extends FormRequest
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
                Rule::unique('waiters', 'email')->where(
                    fn ($query) => $query->where('restaurant_id', $this->user()->id),
                ),
            ],
            'password' => ['required', 'string', 'min:5', 'max:255'],
        ];
    }
}
