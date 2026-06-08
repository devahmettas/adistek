<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reservation_duration_minutes' => ['required', 'integer', 'min:15', 'max:480'],
            'reservation_visible_before_minutes' => ['required', 'integer', 'min:5', 'max:240'],
        ];
    }
}
