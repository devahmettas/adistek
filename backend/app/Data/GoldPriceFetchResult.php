<?php

namespace App\Data;

readonly class GoldPriceFetchResult
{
    /**
     * @param  GoldPriceQuote[]  $quotes
     */
    public function __construct(
        public string $provider,
        public string $source,
        public array $quotes,
        public ?float $hasGoldBase,
        public \DateTimeInterface $fetchedAt,
    ) {}
}
