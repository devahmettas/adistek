<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGuestOrderRequest;
use App\Services\GuestTableOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestTableOrderController extends Controller
{
    public function __construct(
        private readonly GuestTableOrderService $service,
    ) {}

    public function show(Request $request, string $token): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getTableOrderPage($token, $request->query('lang')),
        ]);
    }

    public function store(StoreGuestOrderRequest $request, string $token): JsonResponse
    {
        $result = $this->service->placeOrder(
            $token,
            $request->validated('session_token'),
            $request->validated('items'),
        );

        return response()->json([
            'data' => $result,
            'message' => $result['message'],
        ], 201);
    }
}
