<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'menu_tagline' => ['nullable', 'string', 'max:120'],
            'menu_welcome_text' => ['nullable', 'string', 'max:500'],
        ];
    }
}
