<?php

namespace App\Http\Controllers\Api;

use App\Enums\KitchenStatus;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Http\Requests\CloseTableRequest;
use App\Http\Requests\PartialPayTableRequest;
use App\Http\Requests\StoreTableProductRequest;
use App\Http\Requests\StoreTableRequest;
use App\Http\Requests\UpdateTableProductRequest;
use App\Http\Requests\UpdateTableRequest;
use App\Http\Requests\UpdateTableStatusRequest;
use App\Enums\TableStatus;
use App\Models\RestaurantTable;
use App\Services\KitchenOrderService;
use App\Services\TableReservationService;
use App\Services\TableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly TableService $service,
        private readonly KitchenOrderService $kitchenOrderService,
        private readonly TableReservationService $reservationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $tables = $this->service->listByRestaurant($restaurantId);
        $activeReservedTableIds = $this->reservationService->getActiveReservationTableIds($restaurantId);
        $todayReservationsByTable = $this->reservationService->getTodayReservationsByTable($restaurantId);

        return response()->json([
            'data' => $tables->map(
                fn (RestaurantTable $table) => $this->formatTable(
                    $table,
                    $activeReservedTableIds,
                    $todayReservationsByTable,
                ),
            ),
        ]);
    }

    private function formatTable(
        RestaurantTable $table,
        ?array $activeReservedTableIds = null,
        ?array $todayReservationsByTable = null,
    ): array {
        $data = $table->toArray();
        $data['is_actively_reserved'] = $activeReservedTableIds !== null
            ? in_array($table->id, $activeReservedTableIds, true)
            : $this->reservationService->isTableActivelyReserved($table->restaurant_id, $table->id);
        $data['today_reservations'] = $todayReservationsByTable !== null
            ? ($todayReservationsByTable[$table->id] ?? [])
            : $this->reservationService->getTodayReservationsForTable($table->restaurant_id, $table->id);

        $data['viewing_waiter_name'] = $table->viewing_waiter_name;
        $data['viewing_waiter'] = $table->viewingWaiter
            ? $table->viewingWaiter->only(['id', 'name', 'email'])
            : null;
        $data['assigned_waiter_name'] = $table->assigned_waiter_name;
        $data['assigned_waiter'] = $table->assignedWaiter
            ? $table->assignedWaiter->only(['id', 'name', 'email'])
            : null;

        if (isset($data['products']) && is_array($data['products'])) {
            $data['products'] = array_values(array_filter(
                $data['products'],
                fn (array $product) => ($product['pivot']['kitchen_status'] ?? null) !== KitchenStatus::Cancelled->value,
            ));

            $total = array_reduce(
                $data['products'],
                fn (float $sum, array $product) => $sum + ((float) ($product['price'] ?? 0) * (int) ($product['pivot']['quantity'] ?? 1)),
                0.0,
            );
            $data['total_amount'] = number_format($total, 2, '.', '');
        }

        return $data;
    }

    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = $this->service->create($this->restaurantId($request), $request->validated());

        return response()->json([
            'data' => $this->formatTable($table),
        ], 201);
    }

    public function update(UpdateTableRequest $request, RestaurantTable $table): JsonResponse
    {
        $this->ensureTableBelongsToRestaurant($request, $table);

        $updatedTable = $this->service->update(
            $this->restaurantId($request),
            $table->id,
            $request->validated(),
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }

    public function destroy(Request $request, RestaurantTable $table): JsonResponse
    {
        $this->ensureTableBelongsToRestaurant($request, $table);

        $this->service->delete($this->restaurantId($request), $table->id);

        return response()->json([
            'message' => 'Masa silindi.',
        ]);
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

    public function updateTableItem(
        UpdateTableProductRequest $request,
        RestaurantTable $table,
        int $pivotId,
    ): JsonResponse {
        $updatedTable = $this->service->updateTableItem(
            $this->restaurantId($request),
            $table->id,
            $pivotId,
            (int) $request->validated('quantity'),
            $request->validated('note'),
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
        ]);
    }

    public function cancelTableItem(Request $request, RestaurantTable $table, int $pivotId): JsonResponse
    {
        $updatedTable = $this->service->cancelTableItem(
            $this->restaurantId($request),
            $table->id,
            $pivotId,
        );

        return response()->json([
            'data' => $this->formatTable($updatedTable),
            'message' => 'Sipariş iptal edildi.',
        ]);
    }

    public function close(CloseTableRequest $request, RestaurantTable $table): JsonResponse
    {
        $closedTable = $this->service->closeTable(
            $this->restaurantId($request),
            $table->id,
            $request->validated('payment_method'),
        );

        return response()->json([
            'data' => $this->formatTable($closedTable),
            'message' => 'Hesap kapatıldı, masa boşaltıldı.',
        ]);
    }

    public function partialPay(PartialPayTableRequest $request, RestaurantTable $table): JsonResponse
    {
        $this->ensureTableBelongsToRestaurant($request, $table);

        $updatedTable = $this->service->partialPay(
            $this->restaurantId($request),
            $table->id,
            $request->validated('payment_method'),
            $request->validated('items'),
        );

        $message = $updatedTable->status === TableStatus::Empty
            ? 'Seçilen ürünler ödendi, masa boşaltıldı.'
            : 'Parça ödeme alındı, masa açık kalmaya devam ediyor.';

        return response()->json([
            'data' => $this->formatTable($updatedTable),
            'message' => $message,
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

    public function acknowledgeKitchen(Request $request, RestaurantTable $table): JsonResponse
    {
        $this->kitchenOrderService->acknowledgeTableReadyItems(
            $this->restaurantId($request),
            $table->id,
        );

        $updatedTable = $this->service->listByRestaurant($this->restaurantId($request))
            ->firstWhere('id', $table->id);

        return response()->json([
            'data' => $this->formatTable($updatedTable),
            'message' => 'Hazır bildirimi alındı.',
        ]);
    }

    private function ensureTableBelongsToRestaurant(Request $request, RestaurantTable $table): void
    {
        if ($table->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
