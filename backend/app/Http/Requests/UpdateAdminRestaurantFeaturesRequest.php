<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminRestaurantFeaturesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'feature_order_tracking' => ['required', 'boolean'],
            'feature_qr_menu' => ['required', 'boolean'],
            'feature_reservations' => ['required', 'boolean'],
        ];
    }
}
