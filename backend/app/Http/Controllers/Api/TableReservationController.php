<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTableReservationRequest;
use App\Http\Requests\UpdateTableReservationRequest;
use App\Services\TableReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableReservationController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly TableReservationService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        return response()->json([
            'data' => $this->service->getDayOverview(
                $this->restaurantId($request),
                $request->query('date'),
            ),
        ]);
    }

    public function store(StoreTableReservationRequest $request): JsonResponse
    {
        $reservation = $this->service->create(
            $this->restaurantId($request),
            $request->validated(),
        );

        return response()->json([
            'data' => $this->service->formatReservationResponse($reservation),
            'message' => 'Rezervasyon oluşturuldu.',
        ], 201);
    }

    public function update(UpdateTableReservationRequest $request, int $reservation): JsonResponse
    {
        $updated = $this->service->update(
            $this->restaurantId($request),
            $reservation,
            $request->validated(),
        );

        return response()->json([
            'data' => $this->service->formatReservationResponse($updated),
            'message' => 'Rezervasyon güncellendi.',
        ]);
    }

    public function destroy(Request $request, int $reservation): JsonResponse
    {
        $this->service->delete($this->restaurantId($request), $reservation);

        return response()->json([
            'message' => 'Rezervasyon iptal edildi.',
        ]);
    }
}
