<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Repositories\RestaurantRepository;
use Illuminate\Database\Eloquent\Collection;

class RestaurantService
{
    public function __construct(
        private readonly RestaurantRepository $repository,
    ) {}

    public function list(): Collection
    {
        return $this->repository->all();
    }

    public function create(array $data): Restaurant
    {
        return $this->repository->create($data);
    }
}
