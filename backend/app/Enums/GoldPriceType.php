<?php

namespace App\Enums;

enum GoldPriceType: string
{
    case Ayar22 = 'ayar_22';
    case Ayar18 = 'ayar_18';
    case Ayar14 = 'ayar_14';
    case Ayar8 = 'ayar_8';
    case GramAltin = 'gram_altin';
    case CumhuriyetAltini = 'cumhuriyet_altini';
    case EskiCeyrekAltin = 'eski_ceyrek_altin';
    case CeyrekAltin = 'ceyrek_altin';
    case EskiYarimAltin = 'eski_yarim_altin';
    case YarimAltin = 'yarim_altin';
    case EskiZiynet = 'eski_ziynet';
    case TamAltin = 'tam_altin';
    case PaketliHas = 'paketli_has';
    case Ayar24 = 'ayar_24';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Ayar22 => '22 Ayar',
            self::Ayar18 => '18 Ayar',
            self::Ayar14 => '14 Ayar',
            self::Ayar8 => '8 Ayar',
            self::GramAltin => 'Gram Altın',
            self::CumhuriyetAltini => 'Ata Altın',
            self::EskiCeyrekAltin => 'Eski Çeyrek',
            self::CeyrekAltin => 'Yeni Çeyrek',
            self::EskiYarimAltin => 'Eski Yarım',
            self::YarimAltin => 'Yeni Yarım',
            self::EskiZiynet => 'Eski Ziynet',
            self::TamAltin => 'Yeni Ziynet',
            self::PaketliHas => 'Paketli Has',
            self::Ayar24 => 'Has Altın',
        };
    }

    public function izkoKey(): string
    {
        return match ($this) {
            self::Ayar22 => 'yirmiiki',
            self::Ayar18 => 'onsekiz',
            self::Ayar14 => 'ondort',
            self::Ayar8 => 'sekizayar',
            self::GramAltin => 'gram',
            self::CumhuriyetAltini => 'ata',
            self::EskiCeyrekAltin => 'eskiceyrek',
            self::CeyrekAltin => 'yeniceyrek',
            self::EskiYarimAltin => 'eskiyarim',
            self::YarimAltin => 'yeniyarim',
            self::EskiZiynet => 'eskitam',
            self::TamAltin => 'yenitam',
            self::PaketliHas => 'paketlihas',
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
