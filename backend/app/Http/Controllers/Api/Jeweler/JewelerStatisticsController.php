<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Services\JewelerStatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelerStatisticsController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelerStatisticsService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getDashboardStats($this->restaurantId($request)),
        ]);
    }
}
