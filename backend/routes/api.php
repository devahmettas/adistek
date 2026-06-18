<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\KitchenAuthController;
use App\Http\Controllers\Api\KitchenOrderController;
use App\Http\Controllers\Api\KitchenStaffController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RestaurantSettingsController;
use App\Http\Controllers\Api\GuestTableOrderController;
use App\Http\Controllers\Api\MenuSettingsController;
use App\Http\Controllers\Api\MenuSlideController;
use App\Http\Controllers\Api\MenuUploadController;
use App\Http\Controllers\Api\PublicMediaController;
use App\Http\Controllers\Api\PublicMenuController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\TableReservationController;
use App\Http\Controllers\Api\WaiterAuthController;
use App\Http\Controllers\Api\WaiterController;
use App\Http\Controllers\Api\Jeweler\JewelerStatisticsController;
use App\Http\Controllers\Api\Jeweler\JewelryBarcodeController;
use App\Http\Controllers\Api\Jeweler\JewelryCategoryController;
use App\Http\Controllers\Api\Jeweler\JewelryCustomerController;
use App\Http\Controllers\Api\Jeweler\JewelryGoldPriceController;
use App\Http\Controllers\Api\Jeweler\MarketGoldPriceController;
use App\Http\Controllers\Api\Jeweler\JewelryProductController;
use App\Http\Controllers\Api\Jeweler\JewelryRepairController;
use App\Http\Controllers\Api\Jeweler\JewelryPurchaseController;
use App\Http\Controllers\Api\Jeweler\JewelrySaleController;
use App\Http\Controllers\Api\Jeweler\JewelryUploadController;
use App\Http\Controllers\Api\Jeweler\JewelrySettingController;
use App\Http\Controllers\Api\Jeweler\JewelryStockController;
use App\Http\Controllers\Api\Jeweler\JewelryStockCountController;
use App\Http\Controllers\Api\Jeweler\JewelryVaultController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/waiter/auth/login', [WaiterAuthController::class, 'login']);

Route::post('/kitchen/auth/login', [KitchenAuthController::class, 'login']);

Route::post('/admin/auth/login', [AdminAuthController::class, 'login']);

Route::get('/media', [PublicMediaController::class, 'showFromQuery']);
Route::get('/media/{path}', [PublicMediaController::class, 'show'])
    ->where('path', '.*')
    ->name('media.show');

Route::get('/public/menu/{identifier}', [PublicMenuController::class, 'show']);
Route::get('/public/table/{token}', [GuestTableOrderController::class, 'show']);
Route::post('/public/table/{token}/order', [GuestTableOrderController::class, 'store']);

Route::middleware([
    'auth:sanctum',
    'restaurant_or_waiter',
    'restaurant.feature:feature_order_tracking|feature_qr_menu',
])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
});

Route::middleware([
    'auth:sanctum',
    'restaurant_or_waiter',
    'restaurant.feature:feature_order_tracking',
])->group(function () {
    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus']);
    Route::post('/tables/{table}/products', [TableController::class, 'addProduct']);
    Route::patch('/tables/{table}/items/{pivotId}', [TableController::class, 'updateTableItem']);
    Route::post('/tables/{table}/items/{pivotId}/cancel', [TableController::class, 'cancelTableItem']);
    Route::post('/tables/{table}/close', [TableController::class, 'close']);
    Route::post('/tables/{table}/partial-pay', [TableController::class, 'partialPay']);
    Route::post('/tables/{table}/view', [TableController::class, 'claimView']);
    Route::delete('/tables/{table}/view', [TableController::class, 'releaseView']);
    Route::post('/tables/{table}/kitchen/acknowledge', [TableController::class, 'acknowledgeKitchen']);
});

Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::middleware('restaurant.feature:feature_order_tracking|feature_qr_menu')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });

    Route::middleware('restaurant.feature:feature_order_tracking')->group(function () {
        Route::get('/stats', [StatisticsController::class, 'index']);

        Route::get('/waiters', [WaiterController::class, 'index']);
        Route::post('/waiters', [WaiterController::class, 'store']);
        Route::put('/waiters/{waiter}', [WaiterController::class, 'update']);
        Route::delete('/waiters/{waiter}', [WaiterController::class, 'destroy']);

        Route::get('/kitchen-staff', [KitchenStaffController::class, 'index']);
        Route::post('/kitchen-staff', [KitchenStaffController::class, 'store']);
        Route::put('/kitchen-staff/{kitchenStaff}', [KitchenStaffController::class, 'update']);
        Route::delete('/kitchen-staff/{kitchenStaff}', [KitchenStaffController::class, 'destroy']);

        Route::post('/tables', [TableController::class, 'store']);
        Route::put('/tables/{table}', [TableController::class, 'update']);
        Route::delete('/tables/{table}', [TableController::class, 'destroy']);
    });

    Route::middleware('restaurant.feature:feature_reservations')->group(function () {
        Route::get('/restaurant/settings', [RestaurantSettingsController::class, 'show']);
        Route::patch('/restaurant/settings', [RestaurantSettingsController::class, 'update']);

        Route::get('/reservations', [TableReservationController::class, 'index']);
        Route::post('/reservations', [TableReservationController::class, 'store']);
        Route::put('/reservations/{reservation}', [TableReservationController::class, 'update']);
        Route::delete('/reservations/{reservation}', [TableReservationController::class, 'destroy']);
    });

    Route::middleware('restaurant.feature:feature_qr_menu')->group(function () {
        Route::get('/restaurant/menu-settings', [MenuSettingsController::class, 'show']);
        Route::patch('/restaurant/menu-settings', [MenuSettingsController::class, 'update']);

        Route::get('/menu-slides', [MenuSlideController::class, 'index']);
        Route::post('/menu-slides', [MenuSlideController::class, 'store']);
        Route::put('/menu-slides/{menuSlide}', [MenuSlideController::class, 'update']);
        Route::delete('/menu-slides/{menuSlide}', [MenuSlideController::class, 'destroy']);

        Route::post('/menu/uploads', [MenuUploadController::class, 'store']);
    });
});

Route::middleware(['auth:sanctum', 'waiter'])->prefix('waiter')->group(function () {
    Route::get('/auth/me', [WaiterAuthController::class, 'me']);
    Route::post('/auth/logout', [WaiterAuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'kitchen'])->prefix('kitchen')->group(function () {
    Route::get('/auth/me', [KitchenAuthController::class, 'me']);
    Route::post('/auth/logout', [KitchenAuthController::class, 'logout']);

    Route::middleware('restaurant.feature:feature_order_tracking')->group(function () {
        Route::get('/orders', [KitchenOrderController::class, 'index']);
        Route::patch('/orders/{pivotId}/ready', [KitchenOrderController::class, 'markReady']);
        Route::patch('/orders/{pivotId}/dismiss', [KitchenOrderController::class, 'dismissCancelled']);
    });
});

Route::middleware(['auth:sanctum', 'restaurant', 'jeweler'])->prefix('jeweler')->group(function () {
    Route::get('/stats', [JewelerStatisticsController::class, 'index']);

    Route::get('/categories', [JewelryCategoryController::class, 'index']);
    Route::post('/categories', [JewelryCategoryController::class, 'store']);
    Route::put('/categories/{category}', [JewelryCategoryController::class, 'update']);
    Route::delete('/categories/{category}', [JewelryCategoryController::class, 'destroy']);

    Route::get('/products', [JewelryProductController::class, 'index']);
    Route::post('/products/calculate-price', [JewelryProductController::class, 'calculatePrice']);
    Route::post('/products', [JewelryProductController::class, 'store']);
    Route::get('/products/{product}', [JewelryProductController::class, 'show']);
    Route::get('/products/{product}/sale-cost', [JewelryProductController::class, 'saleCost']);
    Route::post('/products/{productId}/update', [JewelryProductController::class, 'updateById'])
        ->whereNumber('productId');
    Route::match(['put', 'patch', 'post'], '/products/{product}', [JewelryProductController::class, 'update']);
    Route::delete('/products/{product}', [JewelryProductController::class, 'destroy']);
    Route::post('/products/{product}/stock', [JewelryProductController::class, 'adjustStock']);

    Route::get('/stock-movements', [JewelryStockController::class, 'index']);

    Route::get('/stock-counts', [JewelryStockCountController::class, 'index']);
    Route::get('/stock-counts/active', [JewelryStockCountController::class, 'active']);
    Route::post('/stock-counts', [JewelryStockCountController::class, 'store']);
    Route::get('/stock-counts/{stockCount}', [JewelryStockCountController::class, 'show']);
    Route::post('/stock-counts/{stockCount}/scan', [JewelryStockCountController::class, 'scan']);
    Route::patch('/stock-counts/{stockCount}/items/{item}', [JewelryStockCountController::class, 'updateItem']);
    Route::patch('/stock-counts/{stockCount}/cash', [JewelryStockCountController::class, 'updateCash']);
    Route::post('/stock-counts/{stockCount}/complete', [JewelryStockCountController::class, 'complete']);
    Route::post('/stock-counts/{stockCount}/cancel', [JewelryStockCountController::class, 'cancel']);

    Route::get('/vault', [JewelryVaultController::class, 'show']);
    Route::post('/vault/cash-transactions', [JewelryVaultController::class, 'storeCashTransaction']);
    Route::put('/vault/cash-transactions/{transaction}', [JewelryVaultController::class, 'updateCashTransaction']);

    Route::get('/sales', [JewelrySaleController::class, 'index']);
    Route::post('/sales', [JewelrySaleController::class, 'store']);
    Route::get('/sales/{sale}', [JewelrySaleController::class, 'show']);
    Route::put('/sales/{sale}', [JewelrySaleController::class, 'update']);

    Route::get('/purchases', [JewelryPurchaseController::class, 'index']);
    Route::post('/purchases', [JewelryPurchaseController::class, 'store']);
    Route::get('/purchases/{purchase}', [JewelryPurchaseController::class, 'show']);
    Route::put('/purchases/{purchase}', [JewelryPurchaseController::class, 'update']);

    Route::get('/repairs', [JewelryRepairController::class, 'index']);
    Route::post('/repairs', [JewelryRepairController::class, 'store']);
    Route::put('/repairs/{repair}', [JewelryRepairController::class, 'update']);
    Route::delete('/repairs/{repair}', [JewelryRepairController::class, 'destroy']);

    Route::get('/customers', [JewelryCustomerController::class, 'index']);
    Route::post('/customers', [JewelryCustomerController::class, 'store']);
    Route::put('/customers/{customer}', [JewelryCustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [JewelryCustomerController::class, 'destroy']);

    Route::get('/barcode/{barcode}', [JewelryBarcodeController::class, 'lookup']);

    Route::get('/gold-prices/live', [MarketGoldPriceController::class, 'live']);
    Route::get('/gold-prices/wait', [MarketGoldPriceController::class, 'wait']);
    Route::get('/gold-prices/latest', [MarketGoldPriceController::class, 'latest']);
    Route::get('/gold-prices/history', [MarketGoldPriceController::class, 'history']);
    Route::post('/gold-prices/sync', [MarketGoldPriceController::class, 'sync']);

    Route::get('/settings', [JewelrySettingController::class, 'show']);
    Route::patch('/settings', [JewelrySettingController::class, 'update']);

    Route::post('/uploads', [JewelryUploadController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/auth/me', [AdminAuthController::class, 'me']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/restaurants', [AdminRestaurantController::class, 'index']);
    Route::post('/restaurants', [AdminRestaurantController::class, 'store']);
    Route::get('/restaurants/{restaurant}', [AdminRestaurantController::class, 'show']);
    Route::put('/restaurants/{restaurant}', [AdminRestaurantController::class, 'update']);
    Route::patch('/restaurants/{restaurant}/features', [AdminRestaurantController::class, 'updateFeatures']);
});
