<?php

namespace App\Services\GoldPrices\Providers;

use App\Contracts\GoldPriceProviderInterface;
use App\Data\GoldPriceFetchResult;
use App\Data\GoldPriceQuote;
use App\Enums\GoldPriceType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IzkoGoldPriceProvider implements GoldPriceProviderInterface
{
    public function getName(): string
    {
        return 'izko';
    }

    public function fetch(): GoldPriceFetchResult
    {
        $config = config('gold_prices.providers.izko');
        $commissionPercent = (float) config('gold_prices.commission_percent', 5);

        $http = Http::timeout(10)
            ->acceptJson()
            ->withOptions(['verify' => (bool) config('gold_prices.verify_ssl', true)])
            ->withHeaders([
                'User-Agent' => 'Adistek-GoldPriceSync/1.0',
            ]);

        $response = $http->get($config['prices_url']);

        if (! $response->successful()) {
            throw new RuntimeException('İZKO altın fiyat API isteği başarısız: '.$response->status());
        }

        $payload = $response->json();

        if (! ($payload['success'] ?? false) || ! is_array($payload['data'] ?? null)) {
            throw new RuntimeException('İZKO altın fiyat API yanıtı geçersiz.');
        }

        $hasGoldBase = isset($payload['has_altin_price'])
            ? (float) $payload['has_altin_price']
            : null;

        $fetchedAt = Carbon::now(config('gold_prices.timezone', 'Europe/Istanbul'));

        $quotes = [];

        foreach ($payload['data'] as $item) {
            $type = GoldPriceType::fromIzkoKey((string) ($item['key'] ?? ''));

            if (! $type) {
                continue;
            }

            $cashSell = (float) ($item['sell_price'] ?? 0);

            if ($cashSell <= 0) {
                continue;
            }

            $cardSell = $type === GoldPriceType::Ayar24
                ? null
                : $this->calculateCardSellPrice($cashSell, $commissionPercent);

            $quotes[] = new GoldPriceQuote(
                type: $type,
                externalKey: (string) $item['key'],
                name: (string) ($item['name'] ?? $type->label()),
                cashSellPrice: $cashSell,
                cardSellPrice: $cardSell,
                hasGoldBase: $hasGoldBase,
            );
        }

        if ($quotes === []) {
            throw new RuntimeException('İZKO API yanıtında desteklenen altın türü bulunamadı.');
        }

        return new GoldPriceFetchResult(
            provider: $this->getName(),
            source: (string) ($payload['source'] ?? $config['source_label']),
            quotes: $quotes,
            hasGoldBase: $hasGoldBase,
            fetchedAt: $fetchedAt,
        );
    }

    private function calculateCardSellPrice(float $cashSell, float $commissionPercent): float
    {
        if ($commissionPercent <= 0) {
            return $cashSell;
        }

        return (float) (ceil(($cashSell * (1 + ($commissionPercent / 100))) / 10) * 10);
    }
}
