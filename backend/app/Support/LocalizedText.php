<?php

namespace App\Support;

class LocalizedText
{
    public const SUPPORTED = ['tr', 'en', 'de', 'ru'];

    public const TRANSLATION_LOCALES = ['en', 'de', 'ru'];

    public static function normalizeLang(?string $lang): string
    {
        $lang = strtolower((string) $lang);

        return in_array($lang, self::SUPPORTED, true) ? $lang : 'tr';
    }

    public static function resolve(?string $default, ?array $translations, string $lang): ?string
    {
        if ($lang === 'tr') {
            return self::clean($default);
        }

        if (! is_array($translations)) {
            return self::clean($default);
        }

        $translated = $translations[$lang] ?? null;

        if (is_string($translated) && trim($translated) !== '') {
            return trim($translated);
        }

        return self::clean($default);
    }

    public static function normalize(?array $translations): ?array
    {
        if (! is_array($translations)) {
            return null;
        }

        $normalized = [];

        foreach (self::TRANSLATION_LOCALES as $lang) {
            $value = $translations[$lang] ?? null;

            if (is_string($value) && trim($value) !== '') {
                $normalized[$lang] = trim($value);
            }
        }

        return $normalized === [] ? null : $normalized;
    }

    private static function clean(?string $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
