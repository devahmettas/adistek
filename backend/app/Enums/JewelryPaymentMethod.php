<?php

namespace App\Enums;

enum JewelryPaymentMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Transfer = 'transfer';
    case GoldExchange = 'gold_exchange';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Nakit',
            self::Card => 'Kart',
            self::Transfer => 'Havale/EFT',
            self::GoldExchange => 'Altın Takas',
        };
    }
}
