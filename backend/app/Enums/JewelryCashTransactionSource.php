<?php

namespace App\Enums;

enum JewelryCashTransactionSource: string
{
    case Manual = 'manual';
    case Sale = 'sale';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manuel',
            self::Sale => 'Satış',
        };
    }
}
