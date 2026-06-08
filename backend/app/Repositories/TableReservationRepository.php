<?php

namespace App\Repositories;

use App\Models\TableReservation;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

class TableReservationRepository
{
    public function getByRestaurantAndDate(int $restaurantId, CarbonInterface $date): Collection
    {
        return TableReservation::query()
            ->with('table')
            ->where('restaurant_id', $restaurantId)
            ->whereDate('reserved_at', $date)
            ->orderBy('reserved_at')
            ->get();
    }

    public function getForTableOnDate(int $restaurantId, int $tableId, CarbonInterface $date): Collection
    {
        return TableReservation::query()
            ->where('restaurant_id', $restaurantId)
            ->where('restaurant_table_id', $tableId)
            ->whereDate('reserved_at', $date)
            ->orderBy('reserved_at')
            ->get();
    }

    public function create(array $data): TableReservation
    {
        return TableReservation::create($data);
    }

    public function findForRestaurant(int $reservationId, int $restaurantId): ?TableReservation
    {
        return TableReservation::query()
            ->where('id', $reservationId)
            ->where('restaurant_id', $restaurantId)
            ->first();
    }

    public function update(TableReservation $reservation, array $data): TableReservation
    {
        $reservation->update($data);

        return $reservation->fresh(['table']);
    }

    public function delete(TableReservation $reservation): void
    {
        $reservation->delete();
    }
}
