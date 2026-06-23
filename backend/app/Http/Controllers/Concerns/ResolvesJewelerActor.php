<?php

namespace App\Http\Controllers\Concerns;

use App\Models\JewelerStaff;
use App\Models\Restaurant;
use App\Support\JewelerPermissions;
use Illuminate\Http\Request;

trait ResolvesJewelerActor
{
    protected function isJewelerOwner(Request $request): bool
    {
        return $request->user() instanceof Restaurant;
    }

    protected function jewelerCan(Request $request, string $permission): bool
    {
        $user = $request->user();

        if ($user instanceof Restaurant) {
            return true;
        }

        if ($user instanceof JewelerStaff) {
            return $user->hasPermission($permission);
        }

        return false;
    }

    protected function jewelerCanViewProfits(Request $request): bool
    {
        return $this->jewelerCan($request, JewelerPermissions::VIEW_PROFITS);
    }

    protected function stripJewelerProfitFields(array $payload): array
    {
        if (isset($payload['summary']) && is_array($payload['summary'])) {
            foreach ([
                'today_profit',
                'week_profit',
                'month_profit',
                'today_margin',
                'week_margin',
                'month_margin',
                'month_cost',
                'month_card_commission',
            ] as $key) {
                unset($payload['summary'][$key]);
            }
        }

        if (isset($payload['inventory']) && is_array($payload['inventory'])) {
            unset($payload['inventory']['inventory_sale_value']);
        }

        if (isset($payload['cash_session'])) {
            $payload['cash_session'] = [
                'is_open' => (bool) ($payload['cash_session']['is_open'] ?? false),
                'opened_at' => null,
                'opening_cash_balance' => null,
            ];
        }

        return $payload;
    }
}
