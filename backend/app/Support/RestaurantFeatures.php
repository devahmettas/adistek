<?php

namespace App\Support;

use App\Models\Restaurant;

class RestaurantFeatures
{
    public const ORDER_TRACKING = 'feature_order_tracking';

    public const QR_MENU = 'feature_qr_menu';

    public const RESERVATIONS = 'feature_reservations';

    public static function isEnabled(Restaurant $restaurant, string $feature): bool
    {
        return (bool) ($restaurant->{$feature} ?? true);
    }

    public static function isAnyEnabled(Restaurant $restaurant, array $features): bool
    {
        foreach ($features as $feature) {
            if (self::isEnabled($restaurant, $feature)) {
                return true;
            }
        }

        return false;
    }
}
