<?php

namespace App\Services\GoldPrices;

use App\Data\GoldPriceFetchResult;
use App\Repositories\GoldPriceRecordRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class GoldPriceSyncService
{
    public function __construct(
        private readonly GoldPriceProviderFactory $providerFactory,
        private readonly GoldPriceRecordRepository $repository,
        private readonly GoldPriceLiveStore $liveStore,
    ) {}

    /**
     * @return array{result: GoldPriceFetchResult, changed: bool, stored_count: int, prices: Collection, version: int}
     */
    public function sync(?string $provider = null): array
    {
        $priceProvider = $this->providerFactory->make($provider);
        $result = $priceProvider->fetch();
        $stored = $this->repository->storeFetchResult($result);
        $changed = $stored->isNotEmpty();

        $prices = $changed
            ? $this->repository->getLatestByType()
            : $this->repository->getLatestByType();

        $version = $this->liveStore->publish(
            $prices,
            $result->hasGoldBase,
            $result->provider,
            $result->source,
            $changed || $this->liveStore->getVersion() === 0,
        );

        if ($changed) {
            Log::info('Altın fiyatları güncellendi.', [
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

    public function getLatestPrices(): Collection
    {
        return $this->repository->getLatestByType();
    }

    public function getLiveStore(): GoldPriceLiveStore
    {
        return $this->liveStore;
    }

    public function getLiveSnapshot(): array
    {
        return $this->liveStore->getSnapshot();
    }
}
