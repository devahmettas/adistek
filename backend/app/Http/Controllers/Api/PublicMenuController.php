<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicMenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    public function __construct(
        private readonly PublicMenuService $service,
    ) {}

    public function show(Request $request, string $identifier): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getMenu($identifier, $request->query('lang')),
        ]);
    }
}
