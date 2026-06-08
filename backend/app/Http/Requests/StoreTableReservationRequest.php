<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'restaurant_table_id' => ['required', 'integer', 'exists:restaurant_tables,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'guest_count' => ['required', 'integer', 'min:1', 'max:50'],
            'reserved_at' => ['required', 'date'],
        ];
    }
}
