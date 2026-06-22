<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $restaurantId = (int) $this->route('restaurant');

        return [
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:500'],
            'service_fee' => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'membership_end_date' => ['nullable', 'date'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('restaurants', 'email')->ignore($restaurantId),
            ],
            'password' => ['nullable', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Restoran adı zorunludur.',
            'contact_person.required' => 'Yetkili kişi zorunludur.',
            'phone.required' => 'Telefon numarası zorunludur.',
            'address.required' => 'Adres zorunludur.',
            'email.required' => 'E-posta zorunludur.',
            'email.email' => 'Geçerli bir e-posta adresi girin.',
            'email.unique' => 'Bu e-posta adresi zaten kayıtlı.',
            'password.min' => 'Şifre en az 6 karakter olmalıdır.',
        ];
    }
}
