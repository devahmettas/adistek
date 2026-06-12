<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*') ? null : '/login',
        );

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias([
            'restaurant' => \App\Http\Middleware\EnsureRestaurant::class,
            'waiter' => \App\Http\Middleware\EnsureWaiter::class,
            'kitchen' => \App\Http\Middleware\EnsureKitchen::class,
            'restaurant_or_waiter' => \App\Http\Middleware\EnsureRestaurantOrWaiter::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'restaurant.feature' => \App\Http\Middleware\EnsureRestaurantFeature::class,
            'jeweler' => \App\Http\Middleware\EnsureJeweler::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
