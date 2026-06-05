<?php

namespace App\Services;

use App\Repositories\RestaurantRepository;
use Illuminate\Database\Eloquent\Collection;

class AdminRestaurantService
{
    public function __construct(
        private readonly RestaurantRepository $repository,
    ) {}

    public function listAll(): Collection
    {
        return $this->repository->allWithStats();
    }
}
