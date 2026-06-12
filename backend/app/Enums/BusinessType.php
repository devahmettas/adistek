<?php

namespace App\Enums;

enum BusinessType: string
{
    case Restaurant = 'restaurant';
    case Jeweler = 'jeweler';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Restaurant => 'Restoran',
            self::Jeweler => 'Kuyumcu',
        };
    }
}
