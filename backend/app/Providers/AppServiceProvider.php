<?php

namespace App\Providers;

use App\Contracts\GoldPriceProviderInterface;
use App\Services\GoldPrices\GoldPriceProviderFactory;
use App\Services\GoldPrices\Providers\IzkoGoldPriceProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GoldPriceProviderFactory::class);
        $this->app->singleton(\App\Services\GoldPrices\GoldPriceLiveStore::class);

        $this->app->bind(GoldPriceProviderInterface::class, function ($app) {
            return $app->make(GoldPriceProviderFactory::class)->make();
        });

        $this->app->bind(IzkoGoldPriceProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
