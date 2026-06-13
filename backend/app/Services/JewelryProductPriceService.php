<?php

namespace App\Services;

use App\Enums\GoldPriceType;
use App\Repositories\GoldPriceRecordRepository;

class JewelryProductPriceService
{
    public function __construct(
        private readonly GoldPriceRecordRepository $repository,
    ) {}

    public function getGoldPricePerGram(int $karat): ?float
    {
        $records = $this->repository->getLatestByType()->keyBy(
            fn ($record) => $record->type->value,
        );

        $type = GoldPriceType::fromKarat($karat);

        if ($type !== null) {
            $record = $records->get($type->value);

            if ($record !== null) {
                return (float) $record->cash_sell_price;
            }
        }

        $hasRecord = $records->get(GoldPriceType::Ayar24->value);

        if ($hasRecord !== null) {
            return round((float) $hasRecord->cash_sell_price * ($karat / 24), 2);
        }

        return null;
    }

    /**
     * @return array{
     *     gold_price_per_gram: float,
     *     metal_value: float,
     *     labor_cost: float,
     *     profit_rate: float,
     *     profit_amount: float,
     *     sale_price: float,
     * }|null
     */
    public function calculate(
        float $weightGram,
        int $karat,
        float $laborCost,
        float $profitRatePercent,
    ): ?array {
        $goldPricePerGram = $this->getGoldPricePerGram($karat);

        if ($goldPricePerGram === null) {
            return null;
        }

        $metalValue = round($weightGram * $goldPricePerGram, 2);
        $profitAmount = round($metalValue * ($profitRatePercent / 100), 2);
        $salePrice = round($metalValue + $laborCost + $profitAmount, 2);

        return [
            'gold_price_per_gram' => $goldPricePerGram,
            'metal_value' => $metalValue,
            'labor_cost' => $laborCost,
            'profit_rate' => $profitRatePercent,
            'profit_amount' => $profitAmount,
            'sale_price' => $salePrice,
        ];
    }
}
