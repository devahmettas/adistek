<?php

namespace App\Services;

use App\Enums\JewelryRepairStatus;
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
        $monthStart = Carbon::now()->startOfMonth();

        $todaySales = JewelrySale::query()
            ->where('restaurant_id', $restaurantId)
            ->whereDate('sold_at', $today)
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

        $lowStockProducts = JewelryProduct::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->where('stock_quantity', '<=', 2)
            ->count();

        $totalProducts = JewelryProduct::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->count();

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
            ->limit(5)
            ->get();

        $paymentBreakdown = JewelrySale::query()
            ->select([
                'payment_method',
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count'),
            ])
            ->where('restaurant_id', $restaurantId)
            ->whereDate('sold_at', $today)
            ->groupBy('payment_method')
            ->get();

        return [
            'summary' => [
                'today_revenue' => (float) $todaySales->sum('total'),
                'today_sales_count' => $todaySales->count(),
                'month_revenue' => (float) $monthSales->sum('total'),
                'month_sales_count' => $monthSales->count(),
                'average_sale' => $todaySales->count() > 0
                    ? round((float) $todaySales->sum('total') / $todaySales->count(), 2)
                    : 0,
            ],
            'inventory' => [
                'total_products' => $totalProducts,
                'low_stock_count' => $lowStockProducts,
            ],
            'repairs' => [
                'active_count' => $activeRepairs,
            ],
            'top_products' => $topProducts->map(fn ($row) => [
                'product_name' => $row->product_name,
                'quantity' => (int) $row->quantity,
                'revenue' => (float) $row->revenue,
            ])->values()->all(),
            'payment_breakdown' => $paymentBreakdown->map(fn ($row) => [
                'payment_method' => $row->payment_method,
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ])->values()->all(),
        ];
    }
}
