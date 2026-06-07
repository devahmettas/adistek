<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly StatisticsService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json([
            'data' => $this->service->getDashboard(
                $this->restaurantId($request),
                $validated['date'] ?? null,
            ),
        ]);
    }
}
