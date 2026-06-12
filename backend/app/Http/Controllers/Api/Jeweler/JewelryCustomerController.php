<?php

namespace App\Http\Controllers\Api\Jeweler;

use App\Http\Controllers\Concerns\ResolvesRestaurantId;
use App\Http\Controllers\Controller;
use App\Models\JewelryCustomer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JewelryCustomerController extends Controller
{
    use ResolvesRestaurantId;

    public function index(Request $request): JsonResponse
    {
        $customers = JewelryCustomer::query()
            ->where('restaurant_id', $this->restaurantId($request))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $customers]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'tc_identity' => ['nullable', 'string', 'size:11'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = JewelryCustomer::create([
            ...$data,
            'restaurant_id' => $this->restaurantId($request),
        ]);

        return response()->json(['data' => $customer], 201);
    }

    public function update(Request $request, JewelryCustomer $customer): JsonResponse
    {
        $this->ensureOwnership($request, $customer);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'tc_identity' => ['nullable', 'string', 'size:11'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer->update($data);

        return response()->json(['data' => $customer->refresh()]);
    }

    public function destroy(Request $request, JewelryCustomer $customer): JsonResponse
    {
        $this->ensureOwnership($request, $customer);
        $customer->delete();

        return response()->json(['message' => 'Müşteri silindi.']);
    }

    private function ensureOwnership(Request $request, JewelryCustomer $customer): void
    {
        if ($customer->restaurant_id !== $this->restaurantId($request)) {
            abort(404);
        }
    }
}
