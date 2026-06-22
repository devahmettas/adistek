<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExtendAdminRestaurantMembershipRequest;
use App\Http\Requests\StoreAdminRestaurantRequest;
use App\Http\Requests\UpdateAdminRestaurantFeaturesRequest;
use App\Http\Requests\UpdateAdminRestaurantRequest;
use App\Services\AdminRestaurantService;
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
        return response()->json([
            'data' => $this->service->listAll(),
        ]);
    }

    public function store(StoreAdminRestaurantRequest $request): JsonResponse
    {
        $restaurant = $this->service->create($request->validated());

        return response()->json([
            'data' => $restaurant->loadCount([
                'categories',
                'products',
                'tables',
                'jewelryCategories',
                'jewelryProducts',
                'jewelryCustomers',
                'jewelrySales',
                'jewelryRepairs',
            ]),
        ], 201);
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
        return response()->json([
            'data' => $this->service->updateFeatures($restaurant, $request->validated()),
        ]);
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

            RestaurantMembershipSchema::ensure();

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
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'membership_end_date')
            || str_contains($message, 'service_fee');
    }
}
