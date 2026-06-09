<?php

namespace App\Http\Requests;

use App\Enums\Allergen;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'allergens' => ['nullable', 'array'],
            'allergens.*' => ['string', Rule::in(Allergen::values())],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
