<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryCashTransactionType;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryCashTransaction;
use App\Services\JewelryCashService;
use App\Services\JewelryVaultService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelryVaultController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryVaultService $service,
        private readonly JewelryCashService $cashService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getOverview($this->restaurantId($request)),
        ]);
    }

    public function storeCashTransaction(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(JewelryCashTransactionType::values())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $restaurantId = $this->restaurantId($request);
        $transaction = $this->cashService->recordManual(
            $restaurantId,
            JewelryCashTransactionType::from($data['type']),
            (float) $data['amount'],
            $data['notes'] ?? null,
        );

        return response()->json([
            'data' => [
                'transaction' => $this->cashService->formatTransaction($transaction->load('sale:id,sale_number')),
                'overview' => $this->service->getOverview($restaurantId),
            ],
        ], 201);
    }

    public function updateCashTransaction(Request $request, JewelryCashTransaction $transaction): JsonResponse
    {
        $this->ensureCashTransactionOwnership($request, $transaction);

        $data = $request->validate([
            'type' => ['required', Rule::in(JewelryCashTransactionType::values())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $restaurantId = $this->restaurantId($request);
        $updated = $this->cashService->updateManual(
            $transaction,
            JewelryCashTransactionType::from($data['type']),
            (float) $data['amount'],
            $data['notes'] ?? null,
        );

        return response()->json([
            'data' => [
                'transaction' => $this->cashService->formatTransaction($updated),
                'overview' => $this->service->getOverview($restaurantId),
            ],
        ]);
    }

    private function ensureCashTransactionOwnership(Request $request, JewelryCashTransaction $transaction): void
    {
        if ($transaction->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
