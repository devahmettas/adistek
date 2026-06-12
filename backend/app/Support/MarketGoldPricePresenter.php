<?php

namespace App\Support;

use App\Enums\GoldPriceType;
use App\Models\GoldPriceRecord;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class MarketGoldPricePresenter
{
    public static function formatRecord(GoldPriceRecord|array $record): array
    {
        if ($record instanceof GoldPriceRecord) {
            return [
                'id' => $record->id,
                'provider' => $record->provider,
                'type' => $record->type instanceof GoldPriceType ? $record->type->value : (string) $record->type,
                'external_key' => $record->external_key,
                'name' => $record->name,
                'cash_sell_price' => (string) $record->cash_sell_price,
                'card_sell_price' => $record->card_sell_price !== null ? (string) $record->card_sell_price : null,
                'has_gold_base' => $record->has_gold_base !== null ? (string) $record->has_gold_base : null,
                'source' => $record->source,
                'fetched_at' => self::formatDateTime($record->fetched_at),
                'created_at' => self::formatDateTime($record->created_at),
            ];
        }

        $type = $record['type'] ?? null;

        if (is_array($type) && isset($type['value'])) {
            $type = $type['value'];
        } elseif ($type instanceof GoldPriceType) {
            $type = $type->value;
        }

        return [
            'id' => $record['id'] ?? null,
            'provider' => $record['provider'] ?? null,
            'type' => (string) $type,
            'external_key' => $record['external_key'] ?? null,
            'name' => $record['name'] ?? null,
            'cash_sell_price' => isset($record['cash_sell_price']) ? (string) $record['cash_sell_price'] : null,
            'card_sell_price' => array_key_exists('card_sell_price', $record) && $record['card_sell_price'] !== null
                ? (string) $record['card_sell_price']
                : null,
            'has_gold_base' => array_key_exists('has_gold_base', $record) && $record['has_gold_base'] !== null
                ? (string) $record['has_gold_base']
                : null,
            'source' => $record['source'] ?? null,
            'fetched_at' => self::formatDateTime($record['fetched_at'] ?? null),
            'created_at' => self::formatDateTime($record['created_at'] ?? null),
        ];
    }

    /**
     * @param  Collection<int, GoldPriceRecord>|array<int, GoldPriceRecord|array<string, mixed>>  $prices
     * @return array<int, array<string, mixed>>
     */
    public static function formatCollection(Collection|array $prices): array
    {
        $formatted = [];

        foreach ($prices as $price) {
            $row = self::formatRecord($price);
            $type = $row['type'] ?? null;

            if (! is_string($type) || $type === '' || $row['cash_sell_price'] === null) {
                continue;
            }

            $formatted[$type] = $row;
        }

        return array_values($formatted);
    }

    private static function formatDateTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toIso8601String();
        }

        if (is_string($value)) {
            return $value;
        }

        return (string) $value;
    }
}
