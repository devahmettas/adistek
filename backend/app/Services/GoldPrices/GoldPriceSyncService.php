<?php

namespace App\Services\GoldPrices;

use App\Data\GoldPriceFetchResult;
use App\Data\GoldPriceQuote;
use App\Enums\GoldPriceType;
use App\Models\GoldPriceRecord;
use App\Repositories\GoldPriceRecordRepository;
use App\Support\MarketGoldPricePresenter;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class GoldPriceSyncService
{
    public function __construct(
        private readonly GoldPriceProviderFactory $providerFactory,
        private readonly GoldPriceRecordRepository $repository,
        private readonly GoldPriceLiveStore $liveStore,
        private readonly IzkoPriceCalculator $calculator,
        private readonly IzkoSettingsStore $settingsStore,
    ) {}

    /**
     * @return array{result: GoldPriceFetchResult, changed: bool, stored_count: int, prices: Collection, version: int}
     */
    public function sync(?string $provider = null, ?float $hasAltinOverride = null): array
    {
        unset($hasAltinOverride);

        $priceProvider = $this->providerFactory->make($provider);
        $cachedHas = $this->liveStore->getLastHasPrice();
        $result = $priceProvider->fetch();
        $stored = $this->repository->storeFetchResult($result);
        $changed = $stored->isNotEmpty();
        $prices = $this->repository->snapshotFromResult($result);
        $hasChanged = $result->hasGoldBase !== null
            && ($cachedHas === null || abs($cachedHas - $result->hasGoldBase) >= (float) config('gold_prices.has_change_threshold', 0.0001));

        $this->liveStore->saveDerivativeState(
            $result->hasGoldBase,
            $this->extractDerivativePricesFromQuotes($result->quotes),
        );

        $version = $this->liveStore->publish(
            $prices,
            $result->hasGoldBase,
            $result->provider,
            $result->source,
            $changed || $hasChanged || $this->liveStore->getVersion() === 0,
        );

        if ($changed) {
            Log::info('Altın fiyatları güncellendi (İZKO API).', [
                'provider' => $result->provider,
                'stored_count' => $stored->count(),
                'has_gold_base' => $result->hasGoldBase,
                'version' => $version,
            ]);
        }

        return [
            'result' => $result,
            'changed' => $changed,
            'stored_count' => $stored->count(),
            'prices' => $prices,
            'version' => $version,
        ];
    }

    /**
     * Ozbag canlı has ile Has Altın + Paketli Has anlık güncelleme (İZKO sayfası gibi).
     *
     * @return array{result: GoldPriceFetchResult, changed: bool, stored_count: int, prices: Collection, version: int}
     */
    public function syncLiveTick(float $hasAltin): array
    {
        $currentPrices = $this->liveStore->recordsFromSnapshot();

        if ($currentPrices->isEmpty()) {
            return $this->sync();
        }

        $config = config('gold_prices.providers.izko');
        $settings = $this->settingsStore->get();
        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $fetchedAt = Carbon::now($timezone);
        $liveQuotes = $this->calculator->calculateHasAndPaketli(
            $hasAltin,
            $settings['settings_by_key'],
            $settings['commission_type'],
            $settings['commission_value'],
        );

        $quotes = [];

        foreach ($liveQuotes as $key => $prices) {
            $type = GoldPriceType::fromIzkoKey($key);

            if (! $type) {
                continue;
            }

            $setting = $settings['settings_by_key'][$key] ?? null;

            $quotes[] = new GoldPriceQuote(
                type: $type,
                externalKey: $key,
                name: (string) ($setting['name'] ?? $type->label()),
                cashSellPrice: (float) $prices['cash'],
                cardSellPrice: $prices['card'] !== null ? (float) $prices['card'] : null,
                hasGoldBase: $hasAltin,
            );
        }

        $partialResult = new GoldPriceFetchResult(
            provider: 'izko',
            source: $config['source_label'],
            quotes: $quotes,
            hasGoldBase: $hasAltin,
            fetchedAt: $fetchedAt,
        );

        $merged = $this->mergeQuotesIntoCollection($currentPrices, $quotes, $partialResult);
        $version = $this->liveStore->publish(
            $merged,
            $hasAltin,
            'izko',
            $config['source_label'],
            false,
        );

        return [
            'result' => $partialResult,
            'changed' => true,
            'stored_count' => 0,
            'prices' => $merged,
            'version' => $version,
        ];
    }

    public function shouldRefreshDerivatives(float $hasAltin): bool
    {
        $lastDerivativeHas = $this->liveStore->getLastDerivativeHas();

        if ($lastDerivativeHas === null) {
            return true;
        }

        return abs($hasAltin - $lastDerivativeHas) >= (float) config('gold_prices.derivative_recalc_threshold', 5);
    }

    public function getLatestPrices(): Collection
    {
        return $this->repository->getLatestByType();
    }

    public function getLiveStore(): GoldPriceLiveStore
    {
        return $this->liveStore;
    }

    public function getFastSnapshot(): array
    {
        $snapshot = $this->liveStore->getSnapshot();

        if (! empty($snapshot['prices'])) {
            $snapshot['changed'] = false;

            return $snapshot;
        }

        $records = $this->repository->getLatestByType();

        if ($records->isEmpty()) {
            $snapshot['changed'] = false;

            return $snapshot;
        }

        $timezone = config('gold_prices.timezone', 'Europe/Istanbul');
        $config = config('gold_prices.providers.izko');
        $hasBase = $records->first(fn (GoldPriceRecord $record) => $record->has_gold_base !== null)?->has_gold_base;
        $lastSync = $this->repository->getLastSyncAt();

        if ($this->liveStore->getVersion() === 0) {
            $this->liveStore->publish(
                $records,
                $hasBase !== null ? (float) $hasBase : null,
                config('gold_prices.provider', 'izko'),
                $config['source_label'],
                true,
            );

            $snapshot = $this->liveStore->getSnapshot();
            $snapshot['changed'] = false;

            return $snapshot;
        }

        return [
            'prices' => MarketGoldPricePresenter::formatCollection($records),
            'has_gold_base' => $hasBase !== null ? (float) $hasBase : null,
            'last_sync_at' => $lastSync?->timezone($timezone)->toIso8601String(),
            'server_time' => Carbon::now($timezone)->toIso8601String(),
            'timezone' => $timezone,
            'sync_interval_seconds' => (int) config('gold_prices.sync_interval_seconds', 1),
            'provider' => config('gold_prices.provider', 'izko'),
            'source' => $config['source_label'],
            'stream_source' => config('gold_prices.stream_source', 'ozbag'),
            'version' => $this->liveStore->getVersion(),
            'changed' => false,
        ];
    }

    public function getLiveSnapshot(): array
    {
        return $this->liveStore->getSnapshot();
    }

    /**
     * @param  list<GoldPriceQuote>  $quotes
     */
    private function mergeQuotesIntoCollection(
        Collection $currentPrices,
        array $quotes,
        GoldPriceFetchResult $result,
    ): Collection {
        $byType = $currentPrices->keyBy(fn (GoldPriceRecord $record) => $record->type->value);

        foreach ($quotes as $quote) {
            $existing = $byType->get($quote->type->value);

            $byType->put($quote->type->value, new GoldPriceRecord([
                'id' => $existing?->id ?? 0,
                'provider' => $result->provider,
                'type' => $quote->type,
                'external_key' => $quote->externalKey,
                'name' => $quote->name,
                'cash_sell_price' => $quote->cashSellPrice,
                'card_sell_price' => $quote->cardSellPrice,
                'has_gold_base' => $quote->hasGoldBase ?? $result->hasGoldBase,
                'source' => $result->source,
                'fetched_at' => $result->fetchedAt,
            ]));
        }

        return $byType->values();
    }

    /**
     * @param  list<GoldPriceQuote>  $quotes
     * @return array<string, array{cash: float, card: float|null}>
     */
    private function extractDerivativePricesFromQuotes(array $quotes): array
    {
        $derivativePrices = [];

        foreach ($quotes as $quote) {
            if (in_array($quote->externalKey, ['hasaltin', 'paketlihas'], true)) {
                continue;
            }

            $derivativePrices[$quote->externalKey] = [
                'cash' => $quote->cashSellPrice,
                'card' => $quote->cardSellPrice,
            ];
        }

        return $derivativePrices;
    }
}
