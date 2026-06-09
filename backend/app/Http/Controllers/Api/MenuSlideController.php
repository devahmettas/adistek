<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuSlideRequest;
use App\Http\Requests\UpdateMenuSlideRequest;
use App\Models\MenuSlide;
use App\Services\MenuSlideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuSlideController extends Controller
{
    public function __construct(
        private readonly MenuSlideService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $slides = $this->service->listByRestaurant($request->user()->id);

        return response()->json([
            'data' => $slides,
        ]);
    }

    public function store(StoreMenuSlideRequest $request): JsonResponse
    {
        $slide = $this->service->create($request->user()->id, $request->validated());

        return response()->json([
            'data' => $slide,
        ], 201);
    }

    public function update(UpdateMenuSlideRequest $request, MenuSlide $menuSlide): JsonResponse
    {
        $this->ensureSlideBelongsToRestaurant($request, $menuSlide);

        $slide = $this->service->update(
            $request->user()->id,
            $menuSlide->id,
            $request->validated(),
        );

        return response()->json([
            'data' => $slide,
        ]);
    }

    public function destroy(Request $request, MenuSlide $menuSlide): JsonResponse
    {
        $this->ensureSlideBelongsToRestaurant($request, $menuSlide);

        $this->service->delete($request->user()->id, $menuSlide->id);

        return response()->json([
            'message' => 'Slayt silindi.',
        ]);
    }

    private function ensureSlideBelongsToRestaurant(Request $request, MenuSlide $slide): void
    {
        if ($slide->restaurant_id !== $request->user()->id) {
            abort(404);
        }
    }
}
