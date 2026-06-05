<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\WaiterAuthController;
use App\Http\Controllers\Api\WaiterController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/waiter/auth/login', [WaiterAuthController::class, 'login']);

Route::post('/admin/auth/login', [AdminAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'restaurant_or_waiter'])->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    Route::get('/tables', [TableController::class, 'index']);
    Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus']);
    Route::post('/tables/{table}/products', [TableController::class, 'addProduct']);
    Route::patch('/tables/{table}/products/{product}', [TableController::class, 'updateProduct']);
    Route::post('/tables/{table}/close', [TableController::class, 'close']);
    Route::post('/tables/{table}/view', [TableController::class, 'claimView']);
    Route::delete('/tables/{table}/view', [TableController::class, 'releaseView']);
});

Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/categories', [CategoryController::class, 'store']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::get('/waiters', [WaiterController::class, 'index']);
    Route::post('/waiters', [WaiterController::class, 'store']);
    Route::put('/waiters/{waiter}', [WaiterController::class, 'update']);
    Route::delete('/waiters/{waiter}', [WaiterController::class, 'destroy']);

    Route::post('/tables', [TableController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'waiter'])->prefix('waiter')->group(function () {
    Route::get('/auth/me', [WaiterAuthController::class, 'me']);
    Route::post('/auth/logout', [WaiterAuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/auth/me', [AdminAuthController::class, 'me']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/restaurants', [AdminRestaurantController::class, 'index']);
});
