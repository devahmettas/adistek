<?php

namespace App\Services\GoldPrices\Providers;

use App\Contracts\GoldPriceProviderInterface;
use App\Data\GoldPriceFetchResult;
use App\Data\GoldPriceQuote;
use App\Enums\GoldPriceType;
use App\Services\GoldPrices\IzkoPriceCalculator;
use App\Services\GoldPrices\IzkoSettingsStore;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class IzkoGoldPriceProvider implements GoldPriceProviderInterface
{
    public function __construct(
        private readonly IzkoPriceCalculator $calculator,
        private readonly IzkoSettingsStore $settingsStore,
    ) {}

    public function getName(): string
    {
        return 'izko';
    }

    public function fetch(?float $hasAltinOverride = null): GoldPriceFetchResult
    {
        $config = config('gold_prices.providers.izko');
        $settings = $this->settingsStore->get();
        $payload = $this->fetchPricesPayload($config['prices_url']);

        $hasFromApi = $payload['has_altin_price'] ?? null;

        if (! is_numeric($hasFromApi) || (float) $hasFromApi <= 0) {
            throw new RuntimeException('İZKO has altın fiyatı alınamadı.');
        }

        $hasGoldBase = (float) $hasFromApi;
        $fetchedAt = Carbon::now(config('gold_prices.timezone', 'Europe/Istanbul'));
        $quotes = [];

        foreach ($payload['data'] as $item) {
            $key = (string) ($item['key'] ?? '');
            $type = GoldPriceType::fromIzkoKey($key);

            if (! $type) {
                continue;
            }

            $cashSell = (float) ($item['sell_price'] ?? 0);

            if ($cashSell <= 0) {
                continue;
            }

            $quotes[] = new GoldPriceQuote(
                type: $type,
                externalKey: $key,
                name: (string) ($item['name'] ?? $type->label()),
                cashSellPrice: $cashSell,
                cardSellPrice: $this->calculator->cardFromCash(
                    $key,
                    $cashSell,
                    $settings['commission_type'],
                    $settings['commission_value'],
                ),
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

    /**
     * @return array{success?: bool, data: array<int, array<string, mixed>>, has_altin_price?: float|int|string, source?: string}
     */
    private function fetchPricesPayload(string $pricesUrl): array
    {
        $response = Http::timeout(5)
            ->acceptJson()
            ->withOptions(['verify' => (bool) config('gold_prices.verify_ssl', true)])
            ->withHeaders(['User-Agent' => 'Adistek-GoldPriceSync/1.0'])
            ->get($pricesUrl);

        if (! $response->successful()) {
            throw new RuntimeException('İZKO altın fiyat API isteği başarısız: '.$response->status());
        }

        $payload = $response->json();

        if (! ($payload['success'] ?? false) || ! is_array($payload['data'] ?? null)) {
            throw new RuntimeException('İZKO altın fiyat API yanıtı geçersiz.');
        }

        return $payload;
    }
}
