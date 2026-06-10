<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminRestaurantRequest;
use App\Http\Requests\UpdateAdminRestaurantRequest;
use App\Services\AdminRestaurantService;
use Illuminate\Http\JsonResponse;

class AdminRestaurantController extends Controller
{
    public function __construct(
        private readonly AdminRestaurantService $service,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listAll(),
        ]);
    }

    public function store(StoreAdminRestaurantRequest $request): JsonResponse
    {
        $restaurant = $this->service->create($request->validated());

        return response()->json([
            'data' => $restaurant->loadCount(['categories', 'products', 'tables']),
        ], 201);
    }

    public function show(int $restaurant): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getById($restaurant),
        ]);
    }

    public function update(UpdateAdminRestaurantRequest $request, int $restaurant): JsonResponse
    {
        return response()->json([
            'data' => $this->service->update($restaurant, $request->validated()),
        ]);
    }
}
