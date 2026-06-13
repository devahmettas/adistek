<?php

namespace App\Services;

use App\Enums\GoldPriceType;
use App\Repositories\GoldPriceRecordRepository;

class JewelryProductPriceService
{
    private const CATEGORY_TO_GOLD_TYPE = [
        'Gram Altın' => GoldPriceType::GramAltin,
        'Çeyrek Altın' => GoldPriceType::CeyrekAltin,
        'Yarım Altın' => GoldPriceType::YarimAltin,
        'Tam Altın' => GoldPriceType::TamAltin,
        'Ata Altın' => GoldPriceType::CumhuriyetAltini,
        'Cumhuriyet Altını' => GoldPriceType::CumhuriyetAltini,
    ];

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

    public function getPiecePriceFromProduct(?string $productName, ?string $categoryName): ?float
    {
        $records = $this->repository->getLatestByType()->keyBy(
            fn ($record) => $record->type->value,
        );

        $type = $this->resolveGoldTypeFromProduct($productName, $categoryName);
        if ($type === null) {
            return null;
        }

        $record = $records->get($type->value);
        if ($record === null) {
            return null;
        }

        return round((float) $record->cash_sell_price, 2);
    }

    /**
     * @return array{
     *     gold_price_per_gram: float|null,
     *     metal_value: float,
     *     unit_cost: float,
     * }
     */
    public function resolveProductMetrics(
        float $weightGram,
        int $karat,
        float $laborCost,
        float $purchasePrice,
        ?string $productName = null,
        ?string $categoryName = null,
    ): array {
        $goldPricePerGram = $this->getGoldPricePerGram($karat);
        $metalValue = 0.0;

        if ($weightGram > 0 && $goldPricePerGram !== null) {
            $metalValue = round($weightGram * $goldPricePerGram, 2);
        } else {
            $piecePrice = $this->getPiecePriceFromProduct($productName, $categoryName);
            if ($piecePrice !== null) {
                $metalValue = $piecePrice;
            }
        }

        if ($metalValue <= 0 && $purchasePrice > 0) {
            $metalValue = round($purchasePrice, 2);
        }

        $unitCost = $purchasePrice > 0
            ? round($purchasePrice + $laborCost, 2)
            : round($metalValue + $laborCost, 2);

        return [
            'gold_price_per_gram' => $goldPricePerGram,
            'metal_value' => $metalValue,
            'unit_cost' => $unitCost,
        ];
    }

    private function resolveGoldTypeFromProduct(?string $productName, ?string $categoryName): ?GoldPriceType
    {
        if ($categoryName !== null && isset(self::CATEGORY_TO_GOLD_TYPE[$categoryName])) {
            return self::CATEGORY_TO_GOLD_TYPE[$categoryName];
        }

        $normalizedName = mb_strtolower(trim((string) $productName));
        if ($normalizedName === '') {
            return null;
        }

        $nameHints = [
            '/çeyrek|ceyrek/u' => GoldPriceType::CeyrekAltin,
            '/yarım|yarim/u' => GoldPriceType::YarimAltin,
            '/cumhuriyet/u' => GoldPriceType::CumhuriyetAltini,
            '/\bata\b/u' => GoldPriceType::CumhuriyetAltini,
            '/tam\s*altın|tam\s*altin|ziynet/u' => GoldPriceType::TamAltin,
            '/gram\s*altın|gram\s*altin/u' => GoldPriceType::GramAltin,
        ];

        foreach ($nameHints as $pattern => $type) {
            if (preg_match($pattern, $normalizedName) === 1) {
                return $type;
            }
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
