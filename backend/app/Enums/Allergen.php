<?php

namespace App\Enums;

enum Allergen: string
{
    case Gluten = 'gluten';
    case Crustaceans = 'crustaceans';
    case Eggs = 'eggs';
    case Fish = 'fish';
    case Peanuts = 'peanuts';
    case Soy = 'soy';
    case Dairy = 'dairy';
    case Nuts = 'nuts';
    case Celery = 'celery';
    case Mustard = 'mustard';
    case Sesame = 'sesame';
    case Sulfites = 'sulfites';
    case Lupin = 'lupin';
    case Mollusks = 'mollusks';

    public function label(): string
    {
        return match ($this) {
            self::Gluten => 'Gluten',
            self::Crustaceans => 'Kabuklu Deniz Ürünleri',
            self::Eggs => 'Yumurta',
            self::Fish => 'Balık',
            self::Peanuts => 'Fıstık',
            self::Soy => 'Soya',
            self::Dairy => 'Süt',
            self::Nuts => 'Kuruyemiş',
            self::Celery => 'Kereviz',
            self::Mustard => 'Hardal',
            self::Sesame => 'Susam',
            self::Sulfites => 'Sülfit',
            self::Lupin => 'Acı Bakla',
            self::Mollusks => 'Yumuşakçalar',
        };
    }

    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }

    public static function isValid(string $value): bool
    {
        return in_array($value, self::values(), true);
    }
}
