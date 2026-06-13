<?php

namespace App\Services;

use App\Enums\JewelryRepairStatus;
use App\Models\JewelryCustomer;
use App\Models\JewelryProduct;
use App\Models\JewelryRepair;
use App\Models\JewelrySale;
use App\Models\JewelrySaleItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class JewelerStatisticsService
{
    public function getDashboardStats(int $restaurantId): array
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        $todaySales = JewelrySale::query()
            ->where('restaurant_id', $restaurantId)
            ->whereDate('sold_at', $today)
            ->get();

        $weekSales = JewelrySale::query()
            ->where('restaurant_id', $restaurantId)
            ->where('sold_at', '>=', $weekStart)
            ->get();

        $monthSales = JewelrySale::query()
            ->where('restaurant_id', $restaurantId)
            ->where('sold_at', '>=', $monthStart)
            ->get();

        $activeRepairs = JewelryRepair::query()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('status', [
                JewelryRepairStatus::Received,
                JewelryRepairStatus::InProgress,
            ])
            ->count();

        $repairStatusCounts = JewelryRepair::query()
            ->where('restaurant_id', $restaurantId)
            ->select(['status', DB::raw('COUNT(*) as count')])
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->status->value ?? (string) $row->status => (int) $row->count]);

        $productStats = JewelryProduct::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->selectRaw('COUNT(*) as total_products')
            ->selectRaw('SUM(stock_quantity) as total_stock_units')
            ->selectRaw('SUM(CASE WHEN stock_quantity <= 2 THEN 1 ELSE 0 END) as low_stock_count')
            ->selectRaw('SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count')
            ->selectRaw('SUM(weight_gram * stock_quantity) as total_weight_gram')
            ->selectRaw('SUM(sale_price * stock_quantity) as inventory_sale_value')
            ->first();

        $topProducts = JewelrySaleItem::query()
            ->select([
                'jewelry_sale_items.product_name',
                DB::raw('SUM(jewelry_sale_items.quantity) as quantity'),
                DB::raw('SUM(jewelry_sale_items.line_total) as revenue'),
            ])
            ->join('jewelry_sales', 'jewelry_sales.id', '=', 'jewelry_sale_items.sale_id')
            ->where('jewelry_sales.restaurant_id', $restaurantId)
            ->where('jewelry_sales.sold_at', '>=', $monthStart)
            ->groupBy('jewelry_sale_items.product_name')
            ->orderByDesc('quantity')
            ->limit(8)
            ->get();

        $categoryBreakdown = JewelrySaleItem::query()
            ->select([
                DB::raw("COALESCE(jewelry_categories.name, 'Kategorisiz') as category_name"),
                DB::raw('SUM(jewelry_sale_items.quantity) as quantity'),
                DB::raw('SUM(jewelry_sale_items.line_total) as revenue'),
            ])
            ->join('jewelry_sales', 'jewelry_sales.id', '=', 'jewelry_sale_items.sale_id')
            ->leftJoin('jewelry_products', 'jewelry_products.id', '=', 'jewelry_sale_items.product_id')
            ->leftJoin('jewelry_categories', 'jewelry_categories.id', '=', 'jewelry_products.category_id')
            ->where('jewelry_sales.restaurant_id', $restaurantId)
            ->where('jewelry_sales.sold_at', '>=', $monthStart)
            ->groupBy('category_name')
            ->orderByDesc('revenue')
            ->limit(6)
            ->get();

        $todayPaymentBreakdown = JewelrySale::query()
            ->select([
                'payment_method',
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count'),
            ])
            ->where('restaurant_id', $restaurantId)
            ->whereDate('sold_at', $today)
            ->groupBy('payment_method')
            ->get();

        $monthPaymentBreakdown = JewelrySale::query()
            ->select([
                'payment_method',
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count'),
            ])
            ->where('restaurant_id', $restaurantId)
            ->where('sold_at', '>=', $monthStart)
            ->groupBy('payment_method')
            ->get();

        $revenueTrend = collect(range(6, 0))->map(function (int $daysAgo) use ($restaurantId) {
            $date = Carbon::today()->subDays($daysAgo);
            $daySales = JewelrySale::query()
                ->where('restaurant_id', $restaurantId)
                ->whereDate('sold_at', $date)
                ->get();

            return [
                'date' => $date->toDateString(),
                'label' => $date->locale('tr')->isoFormat('D MMM'),
                'revenue' => (float) $daySales->sum('total'),
                'sales_count' => $daySales->count(),
            ];
        })->values()->all();

        $karatBreakdown = JewelryProduct::query()
            ->select([
                'karat',
                DB::raw('COUNT(*) as product_count'),
                DB::raw('SUM(stock_quantity) as stock_units'),
                DB::raw('SUM(weight_gram * stock_quantity) as total_weight_gram'),
            ])
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->whereNotNull('karat')
            ->groupBy('karat')
            ->orderByDesc('stock_units')
            ->get();

        $totalCustomers = JewelryCustomer::query()
            ->where('restaurant_id', $restaurantId)
            ->count();

        $monthSalesWithCustomer = JewelrySale::query()
            ->where('restaurant_id', $restaurantId)
            ->where('sold_at', '>=', $monthStart)
            ->whereNotNull('customer_id')
            ->count();

        return [
            'summary' => [
                'today_revenue' => (float) $todaySales->sum('total'),
                'today_sales_count' => $todaySales->count(),
                'week_revenue' => (float) $weekSales->sum('total'),
                'week_sales_count' => $weekSales->count(),
                'month_revenue' => (float) $monthSales->sum('total'),
                'month_sales_count' => $monthSales->count(),
                'average_sale' => $todaySales->count() > 0
                    ? round((float) $todaySales->sum('total') / $todaySales->count(), 2)
                    : 0,
                'month_average_sale' => $monthSales->count() > 0
                    ? round((float) $monthSales->sum('total') / $monthSales->count(), 2)
                    : 0,
            ],
            'inventory' => [
                'total_products' => (int) ($productStats->total_products ?? 0),
                'total_stock_units' => (int) ($productStats->total_stock_units ?? 0),
                'low_stock_count' => (int) ($productStats->low_stock_count ?? 0),
                'out_of_stock_count' => (int) ($productStats->out_of_stock_count ?? 0),
                'total_weight_gram' => round((float) ($productStats->total_weight_gram ?? 0), 3),
                'inventory_sale_value' => round((float) ($productStats->inventory_sale_value ?? 0), 2),
            ],
            'repairs' => [
                'active_count' => $activeRepairs,
                'received_count' => (int) ($repairStatusCounts[JewelryRepairStatus::Received->value] ?? 0),
                'in_progress_count' => (int) ($repairStatusCounts[JewelryRepairStatus::InProgress->value] ?? 0),
                'completed_count' => (int) ($repairStatusCounts[JewelryRepairStatus::Completed->value] ?? 0),
                'delivered_count' => (int) ($repairStatusCounts[JewelryRepairStatus::Delivered->value] ?? 0),
            ],
            'customers' => [
                'total_count' => $totalCustomers,
                'month_sales_with_customer' => $monthSalesWithCustomer,
            ],
            'revenue_trend' => $revenueTrend,
            'top_products' => $topProducts->map(fn ($row) => [
                'product_name' => $row->product_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (float) $row->revenue,
            ])->values()->all(),
            'category_breakdown' => $categoryBreakdown->map(fn ($row) => [
                'category_name' => $row->category_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (float) $row->revenue,
            ])->values()->all(),
            'karat_breakdown' => $karatBreakdown->map(fn ($row) => [
                'karat' => (int) $row->karat,
                'product_count' => (int) $row->product_count,
                'stock_units' => (int) $row->stock_units,
                'total_weight_gram' => round((float) $row->total_weight_gram, 3),
            ])->values()->all(),
            'payment_breakdown' => $todayPaymentBreakdown->map(fn ($row) => [
                'payment_method' => $row->payment_method,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ])->values()->all(),
            'month_payment_breakdown' => $monthPaymentBreakdown->map(fn ($row) => [
                'payment_method' => $row->payment_method,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ])->values()->all(),
        ];
    }
}
