<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Enums\JewelryMetalType;
use App\Enums\JewelryRepairStatus;
use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryRepair;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JewelryRepairController extends Controller
{
    use ResolvesRestaurantId;

    public function index(Request $request): JsonResponse
    {
        $repairs = JewelryRepair::query()
            ->with('customer')
            ->where('restaurant_id', $this->restaurantId($request))
            ->orderByDesc('received_at')
            ->get();

        return response()->json(['data' => $repairs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:jewelry_customers,id'],
            'item_description' => ['required', 'string'],
            'metal_type' => ['nullable', Rule::in(JewelryMetalType::values())],
            'karat' => ['nullable', 'integer', 'min:1', 'max:24'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $repair = JewelryRepair::create([
            ...$data,
            'restaurant_id' => $this->restaurantId($request),
            'repair_number' => $this->generateRepairNumber($request),
            'status' => JewelryRepairStatus::Received,
        ]);

        return response()->json(['data' => $repair->load('customer')], 201);
    }

    public function update(Request $request, JewelryRepair $repair): JsonResponse
    {
        $this->ensureOwnership($request, $repair);

        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:jewelry_customers,id'],
            'item_description' => ['sometimes', 'string'],
            'metal_type' => ['nullable', Rule::in(JewelryMetalType::values())],
            'karat' => ['nullable', 'integer', 'min:1', 'max:24'],
            'status' => ['sometimes', Rule::in(JewelryRepairStatus::values())],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'final_cost' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'delivered_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if (isset($data['status'])) {
            $status = JewelryRepairStatus::from($data['status']);
            if ($status === JewelryRepairStatus::Completed && ! $repair->completed_at) {
                $data['completed_at'] = $data['completed_at'] ?? now();
            }
            if ($status === JewelryRepairStatus::Delivered && ! $repair->delivered_at) {
                $data['delivered_at'] = $data['delivered_at'] ?? now();
            }
        }

        $repair->update($data);

        return response()->json(['data' => $repair->refresh()->load('customer')]);
    }

    public function destroy(Request $request, JewelryRepair $repair): JsonResponse
    {
        $this->ensureOwnership($request, $repair);
        $repair->delete();

        return response()->json(['message' => 'Tamir kaydı silindi.']);
    }

    private function generateRepairNumber(Request $request): string
    {
        $count = JewelryRepair::where('restaurant_id', $this->restaurantId($request))->count() + 1;

        return sprintf('T%06d', $count);
    }

    private function ensureOwnership(Request $request, JewelryRepair $repair): void
    {
        if ($repair->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
