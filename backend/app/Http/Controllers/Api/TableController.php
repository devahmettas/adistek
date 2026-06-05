<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTableProductRequest;
use App\Http\Requests\StoreTableRequest;
use App\Models\RestaurantTable;
use App\Services\TableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function __construct(
        private readonly TableService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tables = $this->service->listByRestaurant($request->user()->id);

        return response()->json([
            'data' => $tables,
        ]);
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = $this->service->create($request->user()->id, $request->validated());

        return response()->json([
            'data' => $table,
        ], 201);
    }

    public function addProduct(
        StoreTableProductRequest $request,
        RestaurantTable $table,
    ): JsonResponse {
        $updatedTable = $this->service->addProduct(
            $request->user()->id,
            $table->id,
            (int) $request->validated('product_id'),
        );

        return response()->json([
            'data' => $updatedTable,
        ], 201);
    }
}
