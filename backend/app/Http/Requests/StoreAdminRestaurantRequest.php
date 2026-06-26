<?php

namespace App\Http\Requests;

use App\Enums\BusinessType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', Rule::in(BusinessType::values())],
            'contact_person' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:500'],
            'service_fee' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'membership_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'feature_jeweler_barcode' => ['sometimes', 'boolean'],
            'feature_jeweler_reports' => ['sometimes', 'boolean'],
            'email' => ['required', 'email', 'max:255', 'unique:restaurants,email'],
            'password' => ['required', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'İşletme adı zorunludur.',
            'contact_person.required' => 'Yetkili kişi zorunludur.',
            'phone.required' => 'Telefon numarası zorunludur.',
            'address.required' => 'Adres zorunludur.',
            'email.required' => 'E-posta zorunludur.',
            'email.email' => 'Geçerli bir e-posta adresi girin.',
            'email.unique' => 'Bu e-posta adresi zaten kayıtlı.',
            'password.required' => 'Şifre zorunludur.',
            'password.min' => 'Şifre en az 6 karakter olmalıdır.',
        ];
    }
}
