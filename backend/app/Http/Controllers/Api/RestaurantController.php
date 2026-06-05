<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRestaurantRequest;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;

class RestaurantController extends Controller
{
    public function __construct(
        private readonly RestaurantService $service,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->service->list(),
        ]);
    }

    public function store(StoreRestaurantRequest $request): JsonResponse
    {
        $restaurant = $this->service->create($request->validated());

        return response()->json([
            'data' => $restaurant,
        ], 201);
    }
}
