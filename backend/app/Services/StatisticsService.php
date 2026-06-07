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
        $waiterPerformance = $this->getWaiterPerformance($daySessions, $revenue);
        $tableDensity = $this->getTableDensity($daySessions, $live, $hourlyRows);

        return [
            'date' => $dateString,
            'summary' => [
                'revenue' => round($revenue, 2),
                'table_sessions' => $tableSessions,
                'items_sold' => $itemsSold,
                'average_bill' => $averageBill,
            ],
            'live' => $live,
            'waiter_performance' => $waiterPerformance,
            'table_density' => $tableDensity,
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

    private function getWaiterPerformance($daySessions, float $totalRevenue): array
    {
        if ($daySessions->isEmpty()) {
            return [
                'top_waiter' => null,
                'waiters' => [],
            ];
        }

        $waiters = $daySessions
            ->groupBy(fn ($session) => $session->assigned_waiter_id ?? 0)
            ->map(function ($sessions, $waiterId) use ($totalRevenue) {
                $revenue = (float) $sessions->sum('total_amount');
                $tableSessions = $sessions->count();
                $first = $sessions->first();

                return [
                    'waiter_id' => $waiterId > 0 ? (int) $waiterId : null,
                    'waiter_name' => $first->assigned_waiter_name ?: 'Atanmamış',
                    'table_sessions' => $tableSessions,
                    'revenue' => round($revenue, 2),
                    'items_sold' => (int) $sessions->sum('item_count'),
                    'average_bill' => $tableSessions > 0 ? round($revenue / $tableSessions, 2) : 0.0,
                    'revenue_share' => $totalRevenue > 0 ? round(($revenue / $totalRevenue) * 100, 1) : 0.0,
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        return [
            'top_waiter' => $waiters->first(),
            'waiters' => $waiters->all(),
        ];
    }

    private function getTableDensity($daySessions, array $live, $hourlyRows): array
    {
        $totalTables = max((int) ($live['total_tables'] ?? 0), 1);
        $sessionCount = $daySessions->count();
        $totalRevenue = (float) $daySessions->sum('total_amount');

        $peakHour = null;
        $peakHourSessions = 0;

        if ($hourlyRows->isNotEmpty()) {
            $peak = $hourlyRows->sortByDesc('sessions')->first();
            $peakHour = sprintf('%02d:00', (int) $peak->hour);
            $peakHourSessions = (int) $peak->sessions;
        }

        $tables = $daySessions
            ->groupBy(fn ($session) => $session->restaurant_table_id ?? 0)
            ->map(function ($sessions, $tableId) use ($sessionCount, $totalRevenue) {
                $revenue = (float) $sessions->sum('total_amount');
                $count = $sessions->count();
                $first = $sessions->first();

                return [
                    'table_id' => $tableId > 0 ? (int) $tableId : null,
                    'table_name' => $first->table_name,
                    'sessions' => $count,
                    'revenue' => round($revenue, 2),
                    'average_bill' => $count > 0 ? round($revenue / $count, 2) : 0.0,
                    'session_share' => $sessionCount > 0 ? round(($count / $sessionCount) * 100, 1) : 0.0,
                    'revenue_share' => $totalRevenue > 0 ? round(($revenue / $totalRevenue) * 100, 1) : 0.0,
                ];
            })
            ->sortByDesc('sessions')
            ->values()
            ->all();

        $hourlyOccupancy = collect(range(0, 23))->map(function (int $hour) use ($hourlyRows, $totalTables) {
            $row = $hourlyRows->get($hour);
            $sessions = (int) ($row->sessions ?? 0);

            return [
                'hour' => $hour,
                'label' => sprintf('%02d:00', $hour),
                'sessions' => $sessions,
                'occupancy_rate' => round(min(($sessions / $totalTables) * 100, 100), 1),
            ];
        })->filter(fn (array $row) => $row['sessions'] > 0)->values()->all();

        $currentOccupancyRate = $live['total_tables'] > 0
            ? round(($live['active_tables'] / $live['total_tables']) * 100, 1)
            : 0.0;

        return [
            'summary' => [
                'total_tables' => (int) $live['total_tables'],
                'sessions_today' => $sessionCount,
                'average_sessions_per_table' => $sessionCount > 0
                    ? round($sessionCount / $totalTables, 2)
                    : 0.0,
                'turnover_rate' => round(($sessionCount / $totalTables) * 100, 1),
                'current_occupancy_rate' => $currentOccupancyRate,
                'current_active_tables' => (int) $live['active_tables'],
                'peak_hour' => $peakHour,
                'peak_hour_sessions' => $peakHourSessions,
            ],
            'tables' => $tables,
            'hourly_occupancy' => $hourlyOccupancy,
        ];
    }
}
