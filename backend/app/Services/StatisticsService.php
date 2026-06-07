<?php

namespace App\Services;

use App\Enums\KitchenStatus;
use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Models\TableSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    public function getDashboard(int $restaurantId, ?string $date = null): array
    {
        $selectedDate = $date
            ? Carbon::parse($date)->startOfDay()
            : now()->startOfDay();

        $dateString = $selectedDate->toDateString();

        $daySessions = TableSession::query()
            ->where('restaurant_id', $restaurantId)
            ->whereDate('closed_at', $dateString)
            ->get();

        $revenue = (float) $daySessions->sum('total_amount');
        $tableSessions = $daySessions->count();
        $itemsSold = (int) $daySessions->sum('item_count');
        $averageBill = $tableSessions > 0 ? round($revenue / $tableSessions, 2) : 0.0;

        $sessionIds = $daySessions->pluck('id');

        $topProducts = $sessionIds->isEmpty()
            ? collect()
            : DB::table('table_session_items')
                ->join('table_sessions', 'table_sessions.id', '=', 'table_session_items.table_session_id')
                ->whereIn('table_session_items.table_session_id', $sessionIds)
                ->select([
                    'table_session_items.product_id',
                    'table_session_items.product_name',
                    DB::raw('SUM(table_session_items.quantity) as quantity'),
                    DB::raw('SUM(table_session_items.line_total) as revenue'),
                ])
                ->groupBy('table_session_items.product_id', 'table_session_items.product_name')
                ->orderByDesc('quantity')
                ->limit(5)
                ->get();

        $topCategories = $sessionIds->isEmpty()
            ? collect()
            : DB::table('table_session_items')
                ->join('table_sessions', 'table_sessions.id', '=', 'table_session_items.table_session_id')
                ->whereIn('table_session_items.table_session_id', $sessionIds)
                ->whereNotNull('table_session_items.category_name')
                ->select([
                    'table_session_items.category_name',
                    DB::raw('SUM(table_session_items.quantity) as quantity'),
                    DB::raw('SUM(table_session_items.line_total) as revenue'),
                ])
                ->groupBy('table_session_items.category_name')
                ->orderByDesc('revenue')
                ->limit(5)
                ->get();

        $hourlyRows = $sessionIds->isEmpty()
            ? collect()
            : TableSession::query()
                ->whereIn('id', $sessionIds)
                ->select([
                    DB::raw('HOUR(closed_at) as hour'),
                    DB::raw('COUNT(*) as sessions'),
                    DB::raw('SUM(total_amount) as revenue'),
                ])
                ->groupBy(DB::raw('HOUR(closed_at)'))
                ->orderBy('hour')
                ->get()
                ->keyBy('hour');

        $hourlyRevenue = collect(range(0, 23))->map(function (int $hour) use ($hourlyRows) {
            $row = $hourlyRows->get($hour);

            return [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'revenue' => round((float) ($row->revenue ?? 0), 2),
                'sessions' => (int) ($row->sessions ?? 0),
            ];
        })->filter(fn (array $row) => $row['revenue'] > 0 || $row['sessions'] > 0)->values();

        $last7Days = collect(range(0, 6))->map(function (int $offset) use ($restaurantId, $selectedDate) {
            $day = $selectedDate->copy()->subDays(6 - $offset);
            $dayString = $day->toDateString();

            $rows = TableSession::query()
                ->where('restaurant_id', $restaurantId)
                ->whereDate('closed_at', $dayString)
                ->selectRaw('COUNT(*) as sessions, COALESCE(SUM(total_amount), 0) as revenue')
                ->first();

            return [
                'date' => $dayString,
                'label' => $day->format('d.m'),
                'revenue' => round((float) ($rows->revenue ?? 0), 2),
                'sessions' => (int) ($rows->sessions ?? 0),
            ];
        });

        $live = $this->getLiveSnapshot($restaurantId);

        return [
            'date' => $dateString,
            'summary' => [
                'revenue' => round($revenue, 2),
                'table_sessions' => $tableSessions,
                'items_sold' => $itemsSold,
                'average_bill' => $averageBill,
            ],
            'live' => $live,
            'top_products' => $topProducts->map(fn ($row) => [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'quantity' => (int) $row->quantity,
                'revenue' => round((float) $row->revenue, 2),
            ])->values(),
            'top_categories' => $topCategories->map(fn ($row) => [
                'category_name' => $row->category_name,
                'quantity' => (int) $row->quantity,
                'revenue' => round((float) $row->revenue, 2),
            ])->values(),
            'hourly_revenue' => $hourlyRevenue,
            'last_7_days' => $last7Days,
        ];
    }

    private function getLiveSnapshot(int $restaurantId): array
    {
        $tables = RestaurantTable::query()
            ->with([
                'products' => fn ($query) => $query->wherePivot(
                    'kitchen_status',
                    '!=',
                    KitchenStatus::Cancelled->value,
                ),
            ])
            ->where('restaurant_id', $restaurantId)
            ->get();

        $activeTables = $tables->filter(
            fn (RestaurantTable $table) => $table->status !== TableStatus::Empty,
        );

        $openRevenue = $activeTables->sum(function (RestaurantTable $table) {
            return $table->products->sum(
                fn ($product) => (float) $product->price * (int) ($product->pivot->quantity ?? 1),
            );
        });

        return [
            'active_tables' => $activeTables->count(),
            'open_revenue' => round($openRevenue, 2),
            'total_tables' => $tables->count(),
        ];
    }
}
