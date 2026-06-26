<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExtendAdminRestaurantMembershipRequest;
use App\Http\Requests\StoreAdminRestaurantRequest;
use App\Http\Requests\UpdateAdminRestaurantFeaturesRequest;
use App\Http\Requests\UpdateAdminRestaurantRequest;
use App\Services\AdminRestaurantService;
use App\Support\RestaurantAdminSchema;
use App\Support\RestaurantMembershipSchema;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class AdminRestaurantController extends Controller
{
    public function __construct(
        private readonly AdminRestaurantService $service,
    ) {}

    public function index(): JsonResponse
    {
        try {
            return response()->json([
                'data' => $this->service->listAll(),
            ]);
        } catch (QueryException $exception) {
            if (! $this->isAdminSchemaError($exception)) {
                throw $exception;
            }

            RestaurantAdminSchema::ensure();

            return response()->json([
                'data' => $this->service->listAll(),
            ]);
        }
    }

    public function store(StoreAdminRestaurantRequest $request): JsonResponse
    {
        try {
            $restaurant = $this->service->create($request->validated());

            return response()->json([
                'data' => $this->service->getById($restaurant->id),
            ], 201);
        } catch (QueryException $exception) {
            if (! $this->isAdminSchemaError($exception)) {
                throw $exception;
            }

            RestaurantAdminSchema::ensure();
            $restaurant = $this->service->create($request->validated());

            return response()->json([
                'data' => $this->service->getById($restaurant->id),
            ], 201);
        }
    }

    public function show(int $restaurant): JsonResponse
    {
        return response()->json([
            'data' => $this->service->getById($restaurant),
        ]);
    }

    public function update(UpdateAdminRestaurantRequest $request, int $restaurant): JsonResponse
    {
        return response()->json([
            'data' => $this->service->update($restaurant, $request->validated()),
        ]);
    }

    public function updateFeatures(UpdateAdminRestaurantFeaturesRequest $request, int $restaurant): JsonResponse
    {
        try {
            return response()->json([
                'data' => $this->service->updateFeatures($restaurant, $request->validated()),
            ]);
        } catch (QueryException $exception) {
            if (! $this->isAdminSchemaError($exception)) {
                throw $exception;
            }

            RestaurantAdminSchema::ensure();

            return response()->json([
                'data' => $this->service->updateFeatures($restaurant, $request->validated()),
            ]);
        }
    }

    public function extendMembership(
        ExtendAdminRestaurantMembershipRequest $request,
        int $restaurant,
    ): JsonResponse {
        $days = (int) $request->validated('days');

        try {
            return response()->json([
                'data' => $this->service->extendMembership($restaurant, $days),
            ]);
        } catch (QueryException $exception) {
            if (! $this->isMembershipSchemaError($exception)) {
                throw $exception;
            }

            RestaurantAdminSchema::ensure();

            return response()->json([
                'data' => $this->service->extendMembership($restaurant, $days),
            ]);
        } catch (\RuntimeException $exception) {
            if (str_contains($exception->getMessage(), 'Üyelik alanları')
                || str_contains($exception->getMessage(), 'restaurants tablosu')) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 503);
            }

            throw $exception;
        }
    }

    public function destroy(int $restaurant): JsonResponse
    {
        $this->service->delete($restaurant);

        return response()->json([
            'message' => 'İşletme silindi.',
        ]);
    }

    private function isMembershipSchemaError(QueryException $exception): bool
    {
        return $this->isAdminSchemaError($exception);
    }

    private function isAdminSchemaError(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'membership_end_date')
            || str_contains($message, 'service_fee')
            || str_contains($message, 'feature_jeweler_barcode')
            || str_contains($message, 'feature_jeweler_reports')
            || str_contains($message, 'feature_order_tracking')
            || str_contains($message, 'feature_qr_menu')
            || str_contains($message, 'feature_reservations')
            || str_contains($message, 'business_type')
            || str_contains($message, 'contact_person')
            || str_contains($message, 'unknown column');
    }
}
