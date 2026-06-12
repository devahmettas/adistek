<?php

namespace App\Data;

use App\Enums\GoldPriceType;

readonly class GoldPriceQuote
{
    public function __construct(
        public GoldPriceType $type,
        public string $externalKey,
        public string $name,
        public float $cashSellPrice,
        public ?float $cardSellPrice,
        public ?float $hasGoldBase,
    ) {}
}
