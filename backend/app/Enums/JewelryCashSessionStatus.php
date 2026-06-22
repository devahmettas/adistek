<?php

namespace App\Enums;

enum JewelryCashSessionStatus: string
{
    case Open = 'open';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Açık',
            self::Closed => 'Kapalı',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
