<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTableProductRequest;
use App\Http\Requests\StoreTableRequest;
use App\Http\Requests\UpdateTableProductRequest;
use App\Http\Requests\UpdateTableStatusRequest;
use App\Models\Product;
use App\Models\RestaurantTable;
use App\Services\TableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly TableService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tables = $this->service->listByRestaurant($this->restaurantId($request));

        return response()->json([
            'data' => $tables->map(fn (RestaurantTable $table) => $this->formatTable($table)),
        ]);
    }

    private function formatTable(RestaurantTable $table): array
    {
        $data = $table->toArray();

        $data['viewing_waiter_name'] = $table->viewing_waiter_name;
        $data['viewing_waiter'] = $table->viewingWaiter
            ? $table->viewingWaiter->only(['id', 'name', 'email'])
            : null;

        return $data;
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = $this->service->create($this->restaurantId($request), $request->validated());

        return response()->json([
            'data' => $this->formatTable($table),
        ], 201);
    }

    public function updateStatus(
        UpdateTableStatusRequest $request,
        RestaurantTable $table,
    ): JsonResponse {
        $updatedTable = $this->service->updateStatus(
            $this->restaurantId($request),
            $table->id,
            $request->validated('status'),
            $this->waiterId($request),
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }

    public function addProduct(
        StoreTableProductRequest $request,
        RestaurantTable $table,
    ): JsonResponse {
        $updatedTable = $this->service->addProduct(
            $this->restaurantId($request),
            $table->id,
            (int) $request->validated('product_id'),
            (int) ($request->validated('quantity') ?? 1),
            $request->validated('note'),
            $this->waiterId($request),
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ], 201);
    }

    public function updateProduct(
        UpdateTableProductRequest $request,
        RestaurantTable $table,
        Product $product,
    ): JsonResponse {
        $updatedTable = $this->service->updateProduct(
            $this->restaurantId($request),
            $table->id,
            $product->id,
            (int) $request->validated('quantity'),
            $request->validated('note'),
            $this->waiterId($request),
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }

    public function close(Request $request, RestaurantTable $table): JsonResponse
    {
        $closedTable = $this->service->closeTable($this->restaurantId($request), $table->id);

        return response()->json([
            'data' => $this->formatTable($closedTable),
            'message' => 'Hesap kapatıldı, masa boşaltıldı.',
        ]);
    }

    public function claimView(Request $request, RestaurantTable $table): JsonResponse
    {
        $waiterId = $this->waiterId($request);

        if (! $waiterId) {
            abort(403, 'Masa ataması sadece garsonlar içindir.');
        }

        $updatedTable = $this->service->claimView(
            $this->restaurantId($request),
            $table->id,
            $waiterId,
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }

    public function releaseView(Request $request, RestaurantTable $table): JsonResponse
    {
        $waiterId = $this->waiterId($request);

        if (! $waiterId) {
            abort(403, 'Masa ataması sadece garsonlar içindir.');
        }

        $updatedTable = $this->service->releaseView(
            $this->restaurantId($request),
            $table->id,
            $waiterId,
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }
}
