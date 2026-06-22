<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryCashSession;
use App\Services\JewelryCashSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryCashSessionController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryCashSessionService $service,
    ) {}

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getStatusPayload($this->restaurantId($request)),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $sessions = $this->service
            ->listByRestaurant($this->restaurantId($request))
            ->map(fn (JewelryCashSession $session) => $this->service->formatSummary($session));

        return response()->json(['data' => $sessions]);
    }

    public function show(Request $request, JewelryCashSession $cashSession): JsonResponse
    {
        $this->ensureOwnership($request, $cashSession);

        $session = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $cashSession->id,
        );

        return response()->json([
            'data' => $this->service->formatSession($session, true),
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $data = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $restaurantId = $this->restaurantId($request);
        $session = $this->service->open(
            $restaurantId,
            (float) $data['opening_balance'],
            $data['notes'] ?? null,
        );

        return response()->json([
            'data' => [
                'session' => $this->service->formatSession($session, true),
                'status' => $this->service->getStatusPayload($restaurantId),
            ],
        ], 201);
    }

    public function close(Request $request): JsonResponse
    {
        $data = $request->validate([
            'counted_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $restaurantId = $this->restaurantId($request);
        $session = $this->service->close(
            $restaurantId,
            (float) $data['counted_balance'],
            $data['notes'] ?? null,
        );

        return response()->json([
            'data' => [
                'session' => $this->service->formatSession($session),
                'status' => $this->service->getStatusPayload($restaurantId),
            ],
        ]);
    }

    private function ensureOwnership(Request $request, JewelryCashSession $session): void
    {
        if ($session->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
