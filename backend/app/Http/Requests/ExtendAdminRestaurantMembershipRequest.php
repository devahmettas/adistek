<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExtendAdminRestaurantMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'days' => ['required', 'integer', Rule::notIn([0]), 'min:-3650', 'max:3650'],
        ];
    }

    public function messages(): array
    {
        return [
            'days.required' => 'Gün sayısı zorunludur.',
            'days.integer' => 'Gün sayısı tam sayı olmalıdır.',
            'days.not_in' => 'Gün sayısı 0 olamaz.',
            'days.min' => 'En fazla 3650 gün azaltılabilir.',
            'days.max' => 'En fazla 3650 gün eklenebilir.',
        ];
    }
}
