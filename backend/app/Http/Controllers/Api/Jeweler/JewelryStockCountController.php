<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryStockCount;
use App\Models\JewelryStockCountItem;
use App\Services\JewelryStockCountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryStockCountController extends Controller
{
    use ResolvesRestaurantId;

    public function __construct(
        private readonly JewelryStockCountService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->removeLegacySetupFiles();

        $counts = $this->service
            ->listByRestaurant($this->restaurantId($request))
            ->map(fn (JewelryStockCount $count) => $this->service->formatSummary($count));

        return response()->json(['data' => $counts]);
    }

    public function active(Request $request): JsonResponse
    {
        $count = $this->service->findActive($this->restaurantId($request));

        return response()->json([
            'data' => $count ? $this->service->formatCount($count) : null,
        ]);
    }

    public function show(Request $request, JewelryStockCount $stockCount): JsonResponse
    {
        $this->ensureOwnership($request, $stockCount);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        return response()->json(['data' => $this->service->formatCount($count)]);
    }

    public function store(Request $request): JsonResponse
    {
        $count = $this->service->start($this->restaurantId($request));

        return response()->json([
            'data' => $this->service->formatCount($count),
        ], 201);
    }

    public function scan(Request $request, JewelryStockCount $stockCount): JsonResponse
    {
        $this->ensureOwnership($request, $stockCount);

        $data = $request->validate([
            'barcode' => ['required', 'string', 'max:64'],
        ]);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        $this->service->scan($count, $data['barcode']);
        $fresh = $count->fresh(['items.product']);

        return response()->json([
            'data' => $this->service->formatCount($fresh),
        ]);
    }

    public function updateItem(
        Request $request,
        JewelryStockCount $stockCount,
        JewelryStockCountItem $item,
    ): JsonResponse {
        $this->ensureOwnership($request, $stockCount);

        $data = $request->validate([
            'counted_quantity' => ['nullable', 'integer', 'min:0'],
            'counted_weight_gram' => ['nullable', 'numeric', 'min:0'],
        ]);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        $this->service->updateItem($count, $item, $data);

        return response()->json([
            'data' => $this->service->formatCount($count->fresh(['items.product'])),
        ]);
    }

    public function updateCash(Request $request, JewelryStockCount $stockCount): JsonResponse
    {
        $this->ensureOwnership($request, $stockCount);

        $data = $request->validate([
            'counted_cash_balance' => ['required', 'numeric', 'min:0'],
        ]);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        $updated = $this->service->updateCash($count, (float) $data['counted_cash_balance']);

        return response()->json(['data' => $this->service->formatCount($updated)]);
    }

    public function complete(Request $request, JewelryStockCount $stockCount): JsonResponse
    {
        $this->ensureOwnership($request, $stockCount);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        $completed = $this->service->complete($count);

        return response()->json(['data' => $this->service->formatCount($completed)]);
    }

    public function cancel(Request $request, JewelryStockCount $stockCount): JsonResponse
    {
        $this->ensureOwnership($request, $stockCount);

        $count = $this->service->findForRestaurant(
            $this->restaurantId($request),
            $stockCount->id,
        );

        $cancelled = $this->service->cancel($count);

        return response()->json(['data' => $this->service->formatCount($cancelled)]);
    }

    private function ensureOwnership(Request $request, JewelryStockCount $stockCount): void
    {
        if ((int) $stockCount->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }

    private function removeLegacySetupFiles(): void
    {
        static $removed = false;
        if ($removed) {
            return;
        }
        $removed = true;

        $root = dirname(base_path());
        foreach (['migrate.php', 'diag.php', 'cleanup.php'] as $file) {
            $path = $root.DIRECTORY_SEPARATOR.$file;
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
