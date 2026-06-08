<?php

namespace App\Services;

use App\Enums\TableStatus;
use App\Models\TableReservation;
use App\Repositories\RestaurantRepository;
use App\Repositories\TableRepository;
use App\Repositories\TableReservationRepository;
use Carbon\Carbon;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class TableReservationService
{
    public function __construct(
        private readonly TableReservationRepository $reservationRepository,
        private readonly TableRepository $tableRepository,
        private readonly RestaurantRepository $restaurantRepository,
    ) {}

    public function getDayOverview(int $restaurantId, string $date): array
    {
        $day = Carbon::parse($date)->startOfDay();
        $restaurant = $this->restaurantRepository->find($restaurantId);
        $tables = $this->tableRepository->getByRestaurant($restaurantId);
        $reservations = $this->reservationRepository->getByRestaurantAndDate($restaurantId, $day);

        $reservationsByTable = $reservations->groupBy('restaurant_table_id');
        $now = Carbon::now();
        $isToday = $day->isSameDay($now);
        $visibleBeforeMinutes = $restaurant?->reservation_visible_before_minutes ?? 60;

        return [
            'date' => $day->toDateString(),
            'reservation_duration_minutes' => $restaurant?->reservation_duration_minutes ?? 60,
            'reservation_visible_before_minutes' => $visibleBeforeMinutes,
            'reservations' => $reservations->map(fn (TableReservation $row) => $this->formatReservation($row))->values(),
            'tables' => $tables->map(function ($table) use ($reservationsByTable, $isToday, $now, $visibleBeforeMinutes) {
                $tableReservations = $reservationsByTable->get($table->id, collect());

                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'current_status' => $table->status instanceof TableStatus
                        ? $table->status->value
                        : (string) $table->status,
                    'has_reservations_on_date' => $tableReservations->isNotEmpty(),
                    'is_actively_reserved' => $isToday && $this->isActivelyReserved(
                        $tableReservations,
                        $now,
                        $visibleBeforeMinutes,
                    ),
                    'reservations' => $tableReservations
                        ->map(fn (TableReservation $row) => $this->formatReservation($row))
                        ->values(),
                ];
            })->values(),
        ];
    }

    public function create(int $restaurantId, array $data): TableReservation
    {
        $table = $this->tableRepository->findForRestaurant((int) $data['restaurant_table_id'], $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $reservedAt = Carbon::parse($data['reserved_at']);
        $restaurant = $this->restaurantRepository->find($restaurantId);
        $duration = $restaurant?->reservation_duration_minutes ?? 60;

        if ($reservedAt->isPast()) {
            throw new UnprocessableEntityHttpException('Rezervasyon saati geçmiş bir zaman olamaz.');
        }

        $this->assertNoOverlap($restaurantId, $table->id, $reservedAt, $duration);

        return $this->reservationRepository->create([
            'restaurant_id' => $restaurantId,
            'restaurant_table_id' => $table->id,
            'customer_name' => trim($data['customer_name']),
            'phone' => trim($data['phone']),
            'guest_count' => (int) $data['guest_count'],
            'reserved_at' => $reservedAt,
            'duration_minutes' => $duration,
        ])->load('table');
    }

    public function update(int $restaurantId, int $reservationId, array $data): TableReservation
    {
        $reservation = $this->reservationRepository->findForRestaurant($reservationId, $restaurantId);

        if (! $reservation) {
            throw new NotFoundHttpException('Rezervasyon bulunamadı.');
        }

        $table = $this->tableRepository->findForRestaurant((int) $data['restaurant_table_id'], $restaurantId);

        if (! $table) {
            throw new NotFoundHttpException('Masa bulunamadı.');
        }

        $reservedAt = Carbon::parse($data['reserved_at']);
        $restaurant = $this->restaurantRepository->find($restaurantId);
        $duration = $restaurant?->reservation_duration_minutes ?? 60;

        if ($reservedAt->isPast()) {
            throw new UnprocessableEntityHttpException('Rezervasyon saati geçmiş bir zaman olamaz.');
        }

        $this->assertNoOverlap($restaurantId, $table->id, $reservedAt, $duration, $reservationId);

        return $this->reservationRepository->update($reservation, [
            'restaurant_table_id' => $table->id,
            'customer_name' => trim($data['customer_name']),
            'phone' => trim($data['phone']),
            'guest_count' => (int) $data['guest_count'],
            'reserved_at' => $reservedAt,
            'duration_minutes' => $duration,
        ]);
    }

    public function getTodayReservationsByTable(int $restaurantId, ?Carbon $now = null): array
    {
        $now = $now ?? Carbon::now();
        $reservations = $this->reservationRepository->getByRestaurantAndDate(
            $restaurantId,
            $now->copy()->startOfDay(),
        );

        return $reservations
            ->groupBy('restaurant_table_id')
            ->map(fn ($tableReservations) => $tableReservations
                ->map(fn (TableReservation $reservation) => [
                    'id' => $reservation->id,
                    'reserved_time' => $reservation->reserved_at->format('H:i'),
                    'customer_name' => $reservation->customer_name,
                    'guest_count' => $reservation->guest_count,
                ])
                ->values()
                ->all())
            ->all();
    }

    public function getTodayReservationsForTable(int $restaurantId, int $tableId, ?Carbon $now = null): array
    {
        $byTable = $this->getTodayReservationsByTable($restaurantId, $now);

        return $byTable[$tableId] ?? [];
    }

    public function getActiveReservationTableIds(int $restaurantId, ?Carbon $now = null): array
    {
        $now = $now ?? Carbon::now();
        $restaurant = $this->restaurantRepository->find($restaurantId);
        $visibleBeforeMinutes = $restaurant?->reservation_visible_before_minutes ?? 60;
        $reservations = $this->reservationRepository->getByRestaurantAndDate(
            $restaurantId,
            $now->copy()->startOfDay(),
        );

        $tableIds = [];

        foreach ($reservations->groupBy('restaurant_table_id') as $tableId => $tableReservations) {
            if ($this->isActivelyReserved($tableReservations, $now, $visibleBeforeMinutes)) {
                $tableIds[] = (int) $tableId;
            }
        }

        return $tableIds;
    }

    public function isTableActivelyReserved(int $restaurantId, int $tableId, ?Carbon $now = null): bool
    {
        return in_array($tableId, $this->getActiveReservationTableIds($restaurantId, $now), true);
    }

    public function delete(int $restaurantId, int $reservationId): void
    {
        $reservation = $this->reservationRepository->findForRestaurant($reservationId, $restaurantId);

        if (! $reservation) {
            throw new NotFoundHttpException('Rezervasyon bulunamadı.');
        }

        $this->reservationRepository->delete($reservation);
    }

    public function formatReservationResponse(TableReservation $reservation): array
    {
        return $this->formatReservation($reservation);
    }

    private function assertNoOverlap(
        int $restaurantId,
        int $tableId,
        Carbon $reservedAt,
        int $durationMinutes,
        ?int $excludeReservationId = null,
    ): void {
        $newStart = $reservedAt->copy();
        $newEnd = $reservedAt->copy()->addMinutes($durationMinutes);

        $existing = $this->reservationRepository->getForTableOnDate(
            $restaurantId,
            $tableId,
            $reservedAt->copy()->startOfDay(),
        );

        foreach ($existing as $reservation) {
            if ($excludeReservationId !== null && $reservation->id === $excludeReservationId) {
                continue;
            }

            $start = $reservation->reserved_at->copy();
            $end = $reservation->reserved_at->copy()->addMinutes($reservation->duration_minutes);

            if ($newStart->lt($end) && $newEnd->gt($start)) {
                throw new UnprocessableEntityHttpException(
                    'Bu masa seçilen saat aralığında zaten rezerve edilmiş.',
                );
            }
        }
    }

    private function isActivelyReserved($reservations, Carbon $now, int $visibleBeforeMinutes): bool
    {
        foreach ($reservations as $reservation) {
            $visibleFrom = $reservation->reserved_at->copy()->subMinutes($visibleBeforeMinutes);
            $visibleUntil = $reservation->reserved_at->copy()->addMinutes($reservation->duration_minutes);

            if ($now->gte($visibleFrom) && $now->lt($visibleUntil)) {
                return true;
            }
        }

        return false;
    }

    private function formatReservation(TableReservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'restaurant_table_id' => $reservation->restaurant_table_id,
            'table_name' => $reservation->table?->name,
            'customer_name' => $reservation->customer_name,
            'phone' => $reservation->phone,
            'guest_count' => $reservation->guest_count,
            'reserved_at' => $reservation->reserved_at->toIso8601String(),
            'reserved_time' => $reservation->reserved_at->format('H:i'),
            'duration_minutes' => $reservation->duration_minutes,
            'created_at' => $reservation->created_at?->toIso8601String(),
        ];
    }
}
