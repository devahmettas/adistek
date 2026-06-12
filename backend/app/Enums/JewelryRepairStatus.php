<?php

namespace App\Enums;

enum JewelryRepairStatus: string
{
    case Received = 'received';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Received => 'Teslim Alındı',
            self::InProgress => 'İşlemde',
            self::Completed => 'Tamamlandı',
            self::Delivered => 'Teslim Edildi',
            self::Cancelled => 'İptal',
        };
    }
}
