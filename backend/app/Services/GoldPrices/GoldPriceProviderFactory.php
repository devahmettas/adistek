<?php

namespace App\Services\GoldPrices;

use App\Contracts\GoldPriceProviderInterface;
use InvalidArgumentException;

class GoldPriceProviderFactory
{
    public function make(?string $provider = null): GoldPriceProviderInterface
    {
        $provider = $provider ?? config('gold_prices.provider');
        $config = config("gold_prices.providers.{$provider}");

        if (! $config || ! isset($config['class'])) {
            throw new InvalidArgumentException("Altın fiyat sağlayıcısı bulunamadı: {$provider}");
        }

        return app($config['class']);
    }
}
