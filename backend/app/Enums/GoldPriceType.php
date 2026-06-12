<?php

namespace App\Enums;

enum GoldPriceType: string
{
    case GramAltin = 'gram_altin';
    case CeyrekAltin = 'ceyrek_altin';
    case YarimAltin = 'yarim_altin';
    case TamAltin = 'tam_altin';
    case CumhuriyetAltini = 'cumhuriyet_altini';
    case Ayar14 = 'ayar_14';
    case Ayar18 = 'ayar_18';
    case Ayar22 = 'ayar_22';
    case Ayar24 = 'ayar_24';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::GramAltin => 'Gram Altın',
            self::CeyrekAltin => 'Çeyrek Altın',
            self::YarimAltin => 'Yarım Altın',
            self::TamAltin => 'Tam Altın',
            self::CumhuriyetAltini => 'Cumhuriyet Altını',
            self::Ayar14 => '14 Ayar',
            self::Ayar18 => '18 Ayar',
            self::Ayar22 => '22 Ayar',
            self::Ayar24 => '24 Ayar',
        };
    }

    public function izkoKey(): string
    {
        return match ($this) {
            self::GramAltin => 'gram',
            self::CeyrekAltin => 'yeniceyrek',
            self::YarimAltin => 'yeniyarim',
            self::TamAltin => 'yenitam',
            self::CumhuriyetAltini => 'ata',
            self::Ayar14 => 'ondort',
            self::Ayar18 => 'onsekiz',
            self::Ayar22 => 'yirmiiki',
            self::Ayar24 => 'hasaltin',
        };
    }

    public static function fromIzkoKey(string $key): ?self
    {
        foreach (self::cases() as $type) {
            if ($type->izkoKey() === $key) {
                return $type;
            }
        }

        return null;
    }
}
