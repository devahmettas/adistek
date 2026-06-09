<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMenuTranslations;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    use ValidatesMenuTranslations;
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_translations' => $this->nameTranslationRules()['name_translations'],
            'name_translations.en' => $this->nameTranslationRules()['name_translations.en'],
            'name_translations.de' => $this->nameTranslationRules()['name_translations.de'],
            'name_translations.ru' => $this->nameTranslationRules()['name_translations.ru'],
            'image_path' => ['nullable', 'string', 'max:500'],
        ];
    }
}
