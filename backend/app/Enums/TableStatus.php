<?php

namespace App\Enums;

enum TableStatus: string
{
    case Empty = 'empty';
    case Occupied = 'occupied';
    case WaitingOrder = 'waiting_order';
    case Ordered = 'ordered';
    case Served = 'served';
    case BillRequested = 'bill_requested';
    case Reserved = 'reserved';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
