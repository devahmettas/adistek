<?php

namespace App\Enums;

enum JewelryStockCountStatus: string
{
    case Draft = 'draft';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Devam ediyor',
            self::Completed => 'Tamamlandı',
            self::Cancelled => 'İptal',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
