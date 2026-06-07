<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\KitchenAuthController;
use App\Http\Controllers\Api\KitchenOrderController;
use App\Http\Controllers\Api\KitchenStaffController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\GuestTableOrderController;
use App\Http\Controllers\Api\PublicMenuController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\WaiterAuthController;
use App\Http\Controllers\Api\WaiterController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/waiter/auth/login', [WaiterAuthController::class, 'login']);

Route::post('/kitchen/auth/login', [KitchenAuthController::class, 'login']);

Route::post('/admin/auth/login', [AdminAuthController::class, 'login']);

Route::get('/public/menu/{identifier}', [PublicMenuController::class, 'show']);
Route::get('/public/table/{token}', [GuestTableOrderController::class, 'show']);
Route::post('/public/table/{token}/order', [GuestTableOrderController::class, 'store']);

Route::middleware(['auth:sanctum', 'restaurant_or_waiter'])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus']);
    Route::post('/tables/{table}/products', [TableController::class, 'addProduct']);
    Route::patch('/tables/{table}/items/{pivotId}', [TableController::class, 'updateTableItem']);
    Route::post('/tables/{table}/items/{pivotId}/cancel', [TableController::class, 'cancelTableItem']);
    Route::post('/tables/{table}/close', [TableController::class, 'close']);
    Route::post('/tables/{table}/view', [TableController::class, 'claimView']);
    Route::delete('/tables/{table}/view', [TableController::class, 'releaseView']);
    Route::post('/tables/{table}/kitchen/acknowledge', [TableController::class, 'acknowledgeKitchen']);
});

Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/stats', [StatisticsController::class, 'index']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

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

Route::middleware(['auth:sanctum', 'waiter'])->prefix('waiter')->group(function () {
    Route::get('/auth/me', [WaiterAuthController::class, 'me']);
    Route::post('/auth/logout', [WaiterAuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'kitchen'])->prefix('kitchen')->group(function () {
    Route::get('/auth/me', [KitchenAuthController::class, 'me']);
    Route::post('/auth/logout', [KitchenAuthController::class, 'logout']);
    Route::get('/orders', [KitchenOrderController::class, 'index']);
    Route::patch('/orders/{pivotId}/ready', [KitchenOrderController::class, 'markReady']);
    Route::patch('/orders/{pivotId}/dismiss', [KitchenOrderController::class, 'dismissCancelled']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/auth/me', [AdminAuthController::class, 'me']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/restaurants', [AdminRestaurantController::class, 'index']);
});
