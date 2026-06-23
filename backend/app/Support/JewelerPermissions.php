<?php

namespace App\Support;

class JewelerPermissions
{
    public const VIEW_DASHBOARD = 'view_dashboard';

    public const VIEW_VAULT = 'view_vault';

    public const VIEW_PROFITS = 'view_profits';

    public const VIEW_REPORTS = 'view_reports';

    public const MANAGE_PRODUCTS = 'manage_products';

    public const MANAGE_SALES = 'manage_sales';

    public const MANAGE_PURCHASES = 'manage_purchases';

    public const MANAGE_CUSTOMERS = 'manage_customers';

    public const MANAGE_STOCK_COUNT = 'manage_stock_count';

    public const MANAGE_SETTINGS = 'manage_settings';

    public static function all(): array
    {
        return [
            self::VIEW_DASHBOARD,
            self::VIEW_VAULT,
            self::VIEW_PROFITS,
            self::VIEW_REPORTS,
            self::MANAGE_PRODUCTS,
            self::MANAGE_SALES,
            self::MANAGE_PURCHASES,
            self::MANAGE_CUSTOMERS,
            self::MANAGE_STOCK_COUNT,
            self::MANAGE_SETTINGS,
        ];
    }

    public static function labels(): array
    {
        return [
            self::VIEW_DASHBOARD => 'Dashboard',
            self::VIEW_VAULT => 'Kasa yönetimi',
            self::VIEW_PROFITS => 'Kazanç ve kar bilgileri',
            self::VIEW_REPORTS => 'Raporlama',
            self::MANAGE_PRODUCTS => 'Ürün yönetimi',
            self::MANAGE_SALES => 'Satış işlemleri',
            self::MANAGE_PURCHASES => 'Alış işlemleri',
            self::MANAGE_CUSTOMERS => 'Müşteri yönetimi',
            self::MANAGE_STOCK_COUNT => 'Stok takip',
            self::MANAGE_SETTINGS => 'Operasyonel ayarlar',
        ];
    }

    public static function defaultsForNewStaff(): array
    {
        return [
            self::VIEW_DASHBOARD => true,
            self::VIEW_VAULT => false,
            self::VIEW_PROFITS => false,
            self::VIEW_REPORTS => false,
            self::MANAGE_PRODUCTS => true,
            self::MANAGE_SALES => true,
            self::MANAGE_PURCHASES => true,
            self::MANAGE_CUSTOMERS => true,
            self::MANAGE_STOCK_COUNT => true,
            self::MANAGE_SETTINGS => false,
        ];
    }

    public static function ownerDefaults(): array
    {
        return array_fill_keys(self::all(), true);
    }

    public static function normalize(?array $permissions): array
    {
        $normalized = self::defaultsForNewStaff();

        if (! is_array($permissions)) {
            return $normalized;
        }

        foreach (self::all() as $permission) {
            if (array_key_exists($permission, $permissions)) {
                $normalized[$permission] = (bool) $permissions[$permission];
            }
        }

        return $normalized;
    }
}
