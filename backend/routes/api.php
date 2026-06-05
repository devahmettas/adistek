<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminRestaurantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/admin/auth/login', [AdminAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::get('/tables', [TableController::class, 'index']);
    Route::post('/tables', [TableController::class, 'store']);
    Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus']);
    Route::post('/tables/{table}/products', [TableController::class, 'addProduct']);
    Route::patch('/tables/{table}/products/{product}', [TableController::class, 'updateProduct']);
    Route::post('/tables/{table}/close', [TableController::class, 'close']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/auth/me', [AdminAuthController::class, 'me']);
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/restaurants', [AdminRestaurantController::class, 'index']);
});
