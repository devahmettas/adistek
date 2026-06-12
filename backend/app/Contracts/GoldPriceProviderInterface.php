<?php

namespace App\Contracts;

use App\Data\GoldPriceFetchResult;

interface GoldPriceProviderInterface
{
    public function getName(): string;

    public function fetch(): GoldPriceFetchResult;
}
