<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Services\KitchenOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenOrderController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly KitchenOrderService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->listPendingOrders($this->restaurantId($request)),
        ]);
    }

    public function markReady(Request $request, int $pivotId): JsonResponse
    {
        $this->service->markReady($this->restaurantId($request), $pivotId);

        return response()->json([
            'message' => 'Sipariş hazır olarak işaretlendi.',
        ]);
    }

    public function dismissCancelled(Request $request, int $pivotId): JsonResponse
    {
        $this->service->dismissCancelled($this->restaurantId($request), $pivotId);

        return response()->json([
            'message' => 'İptal bildirimi kapatıldı.',
        ]);
    }
}
