<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::get('/restaurants', [RestaurantController::class, 'index']);
Route::post('/restaurants', [RestaurantController::class, 'store']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/categories', [CategoryController::class, 'store']);

Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
