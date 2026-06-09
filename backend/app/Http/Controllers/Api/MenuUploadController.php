<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadMenuImageRequest;
use App\Services\MenuUploadService;
use Illuminate\Http\JsonResponse;

class MenuUploadController extends Controller
{
    public function __construct(
        private readonly MenuUploadService $service,
    ) {}

    public function store(UploadMenuImageRequest $request): JsonResponse
    {
        $result = $this->service->upload(
            $request->user()->id,
            $request->file('image'),
            $request->validated('context'),
        );

        return response()->json([
            'data' => $result,
        ], 201);
    }
}
