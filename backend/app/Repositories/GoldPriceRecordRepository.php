<?php

namespace App\Repositories;

use App\Data\GoldPriceFetchResult;
use App\Enums\GoldPriceType;
use App\Models\GoldPriceRecord;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GoldPriceRecordRepository
{
    public function storeFetchResult(GoldPriceFetchResult $result): Collection
    {
        $records = collect();
        $latestByType = $this->getLatestByType()->keyBy(fn (GoldPriceRecord $record) => $record->type->value);

        DB::transaction(function () use ($result, $records, $latestByType) {
            foreach ($result->quotes as $quote) {
                $latest = $latestByType->get($quote->type->value);

                if ($latest && $this->pricesMatch($latest, $quote->cashSellPrice, $quote->cardSellPrice)) {
                    continue;
                }

                $records->push(GoldPriceRecord::create([
                    'provider' => $result->provider,
                    'type' => $quote->type->value,
                    'external_key' => $quote->externalKey,
                    'name' => $quote->name,
                    'cash_sell_price' => $quote->cashSellPrice,
                    'card_sell_price' => $quote->cardSellPrice,
                    'has_gold_base' => $quote->hasGoldBase ?? $result->hasGoldBase,
                    'source' => $result->source,
                    'fetched_at' => $result->fetchedAt,
                ]));
            }
        });

        return $records;
    }

    private function pricesMatch(GoldPriceRecord $latest, float $cashSell, ?float $cardSell): bool
    {
        $cashMatches = (float) $latest->cash_sell_price === $cashSell;
        $latestCard = $latest->card_sell_price !== null ? (float) $latest->card_sell_price : null;
        $cardMatches = $latestCard === $cardSell;

        return $cashMatches && $cardMatches;
    }

    public function getLatestByType(): Collection
    {
        $latestIds = GoldPriceRecord::query()
            ->selectRaw('MAX(id) as id')
            ->groupBy('type')
            ->pluck('id');

        return GoldPriceRecord::query()
            ->whereIn('id', $latestIds)
            ->orderBy('type')
            ->get();
    }

    public function getHistory(GoldPriceType $type, Carbon $from, ?Carbon $to = null): Collection
    {
        return GoldPriceRecord::query()
            ->where('type', $type->value)
            ->where('fetched_at', '>=', $from)
            ->when($to, fn ($query) => $query->where('fetched_at', '<=', $to))
            ->orderBy('fetched_at')
            ->get(['id', 'type', 'cash_sell_price', 'card_sell_price', 'has_gold_base', 'fetched_at']);
    }

    public function getLastSyncAt(): ?Carbon
    {
        $latest = GoldPriceRecord::query()->max('fetched_at');

        return $latest ? Carbon::parse($latest) : null;
    }

    public function pruneOlderThan(Carbon $cutoff): int
    {
        return GoldPriceRecord::query()
            ->where('fetched_at', '<', $cutoff)
            ->delete();
    }
}
