<?php

namespace App\Enums;

enum JewelryStockMovementType: string
{
    case In = 'in';
    case Out = 'out';
    case Adjustment = 'adjustment';
    case Sale = 'sale';
    case Return = 'return';
    case Repair = 'repair';
    case Purchase = 'purchase';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::In => 'Giriş',
            self::Out => 'Çıkış',
            self::Adjustment => 'Düzeltme',
            self::Sale => 'Satış',
            self::Return => 'İade',
            self::Repair => 'Tamir',
            self::Purchase => 'Alım',
        };
    }
}
