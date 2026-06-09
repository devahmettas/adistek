<?php

namespace App\Http\Requests;

use App\Enums\Allergen;
use App\Http\Requests\Concerns\ValidatesMenuTranslations;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    use ValidatesMenuTranslations;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'name_translations' => $this->nameTranslationRules()['name_translations'],
            'name_translations.en' => $this->nameTranslationRules()['name_translations.en'],
            'name_translations.de' => $this->nameTranslationRules()['name_translations.de'],
            'name_translations.ru' => $this->nameTranslationRules()['name_translations.ru'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'description_translations' => $this->descriptionTranslationRules()['description_translations'],
            'description_translations.en' => $this->descriptionTranslationRules()['description_translations.en'],
            'description_translations.de' => $this->descriptionTranslationRules()['description_translations.de'],
            'description_translations.ru' => $this->descriptionTranslationRules()['description_translations.ru'],
            'image_path' => ['nullable', 'string', 'max:500'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'allergens' => ['nullable', 'array'],
            'allergens.*' => ['string', Rule::in(Allergen::values())],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
