<?php

namespace App\Http\Requests\Concerns;

trait ValidatesMenuTranslations
{
    protected function nameTranslationRules(): array
    {
        return [
            'name_translations' => ['nullable', 'array'],
            'name_translations.en' => ['nullable', 'string', 'max:255'],
            'name_translations.de' => ['nullable', 'string', 'max:255'],
            'name_translations.ru' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function descriptionTranslationRules(): array
    {
        return [
            'description_translations' => ['nullable', 'array'],
            'description_translations.en' => ['nullable', 'string', 'max:2000'],
            'description_translations.de' => ['nullable', 'string', 'max:2000'],
            'description_translations.ru' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
