<?php

namespace App\Enums;

enum KitchenStatus: string
{
    case Pending = 'pending';
    case Ready = 'ready';
    case Acknowledged = 'acknowledged';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
