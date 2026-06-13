<?php

namespace App\Services\GoldPrices;

class IzkoPriceCalculator
{
    /** @var list<string> */
    private const DERIVATIVE_KEYS = [
        'yirmiiki',
        'onsekiz',
        'ondort',
        'sekizayar',
        'gram',
        'ata',
        'eskiceyrek',
        'yeniceyrek',
        'eskiyarim',
        'yeniyarim',
        'eskitam',
        'yenitam',
    ];

    /**
     * İZKO guncel-kur sayfasındaki JavaScript formüllerinin birebir karşılığı.
     *
     * @param  array<string, array{milyem: float|int|string, profit: float|int|string, name?: string}>  $settingsByKey
     * @param  array<string, array{cash: float, card: float|null}>  $previousDerivativePrices
     * @return array{
     *     quotes: array<string, array{cash: float, card: float|null}>,
     *     last_derivative_has: float|null,
     *     derivatives_recalculated: bool
     * }
     */
    public function calculate(
        float $hasAltin,
        array $settingsByKey,
        string $commissionType,
        float $commissionValue,
        array $previousDerivativePrices = [],
        ?float $lastDerivativeHas = null,
        float $derivativeThreshold = 5.0,
    ): array {
        $quotes = [];

        $quotes['hasaltin'] = $this->calculateHasAltin($hasAltin, $settingsByKey['hasaltin'] ?? null);
        $quotes['paketlihas'] = $this->calculatePaketliHas(
            $hasAltin,
            $settingsByKey['paketlihas'] ?? null,
            $commissionType,
            $commissionValue,
        );

        $shouldRecalcDerivatives = $lastDerivativeHas === null
            || abs($hasAltin - $lastDerivativeHas) >= $derivativeThreshold;

        if ($shouldRecalcDerivatives) {
            $discounts = [];

            foreach (self::DERIVATIVE_KEYS as $key) {
                $setting = $settingsByKey[$key] ?? null;

                if (! is_array($setting)) {
                    continue;
                }

                $discounts[$key] = $this->calculateDiscount(
                    $hasAltin,
                    (float) $setting['milyem'],
                    (float) $setting['profit'],
                );
            }

            if (isset($discounts['yeniceyrek'])) {
                $discounts['yeniyarim'] ??= $this->ceilToTen($discounts['yeniceyrek'] * 2);
                $discounts['yenitam'] ??= $this->ceilToTen($discounts['yeniceyrek'] * 4);
            }

            if (isset($discounts['eskiceyrek'])) {
                $discounts['eskiyarim'] ??= $this->ceilToTen($discounts['eskiceyrek'] * 2);
                $discounts['eskitam'] ??= $this->ceilToTen($discounts['eskiceyrek'] * 4);
            }

            foreach ($discounts as $key => $cash) {
                $quotes[$key] = [
                    'cash' => $cash,
                    'card' => $this->calculateRegular($cash, $commissionType, $commissionValue),
                ];
            }
        } else {
            foreach ($previousDerivativePrices as $key => $prices) {
                if (in_array($key, ['hasaltin', 'paketlihas'], true)) {
                    continue;
                }

                $quotes[$key] = $prices;
            }
        }

        return [
            'quotes' => $quotes,
            'last_derivative_has' => $shouldRecalcDerivatives ? $hasAltin : $lastDerivativeHas,
            'derivatives_recalculated' => $shouldRecalcDerivatives,
        ];
    }

    private function calculateDiscount(float $altin, float $milyem, float $profit): float
    {
        return $this->ceilToTen(($altin * $milyem) + $profit);
    }

    private function calculateRegular(float $discount, string $type, float $value): float
    {
        if ($value <= 0) {
            return $discount;
        }

        if ($type === 'fixed') {
            return $this->ceilToTen($discount + $value);
        }

        return $this->ceilToTen($discount * (1 + ($value / 100)));
    }

    private function calculateHasAltin(float $altin, ?array $setting): array
    {
        $milyem = (float) ($setting['milyem'] ?? 1);
        $profit = (float) ($setting['profit'] ?? 0);

        return [
            'cash' => $this->roundTwo(($altin * $milyem) + $profit),
            'card' => null,
        ];
    }

    private function calculatePaketliHas(
        float $altin,
        ?array $setting,
        string $commissionType,
        float $commissionValue,
    ): array {
        $milyem = (float) ($setting['milyem'] ?? 1.002);
        $profit = (float) ($setting['profit'] ?? 60);
        $cash = $this->roundTwo(($altin * $milyem) + $profit);
        $card = $cash;

        if ($commissionValue > 0) {
            $card = $commissionType === 'fixed'
                ? $this->roundTwo($cash + $commissionValue)
                : $this->roundTwo($cash * (1 + ($commissionValue / 100)));
        }

        return [
            'cash' => $cash,
            'card' => $card,
        ];
    }

    private function ceilToTen(float $value): float
    {
        return (float) (ceil($value / 10) * 10);
    }

    /**
     * @param  array<string, array{milyem: float|int|string, profit: float|int|string, name?: string}>  $settingsByKey
     * @return array{hasaltin: array{cash: float, card: float|null}, paketlihas: array{cash: float, card: float|null}}
     */
    public function calculateHasAndPaketli(
        float $hasAltin,
        array $settingsByKey,
        string $commissionType,
        float $commissionValue,
    ): array {
        return [
            'hasaltin' => $this->calculateHasAltin($hasAltin, $settingsByKey['hasaltin'] ?? null),
            'paketlihas' => $this->calculatePaketliHas(
                $hasAltin,
                $settingsByKey['paketlihas'] ?? null,
                $commissionType,
                $commissionValue,
            ),
        ];
    }

    public function cardFromCash(
        string $izkoKey,
        float $cash,
        string $commissionType,
        float $commissionValue,
    ): ?float {
        if ($izkoKey === 'hasaltin') {
            return null;
        }

        if ($izkoKey === 'paketlihas') {
            if ($commissionValue <= 0) {
                return $cash;
            }

            if ($commissionType === 'fixed') {
                return $this->roundTwo($cash + $commissionValue);
            }

            return $this->roundTwo($cash * (1 + ($commissionValue / 100)));
        }

        return $this->calculateRegular($cash, $commissionType, $commissionValue);
    }

    private function roundTwo(float $value): float
    {
        return round($value, 2);
    }
}
