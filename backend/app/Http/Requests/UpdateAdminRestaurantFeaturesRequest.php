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
            'feature_order_tracking' => ['sometimes', 'boolean'],
            'feature_qr_menu' => ['sometimes', 'boolean'],
            'feature_reservations' => ['sometimes', 'boolean'],
            'feature_jeweler_barcode' => ['sometimes', 'boolean'],
            'feature_jeweler_reports' => ['sometimes', 'boolean'],
        ];
    }
}
