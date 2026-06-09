<?php

namespace App\Services;

use App\Models\MenuSlide;
use App\Repositories\MenuSlideRepository;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MenuSlideService
{
    public function __construct(
        private readonly MenuSlideRepository $repository,
        private readonly MenuUploadService $uploadService,
    ) {}

    public function listByRestaurant(int $restaurantId): Collection
    {
        return $this->repository->getByRestaurant($restaurantId);
    }

    public function create(int $restaurantId, array $data): MenuSlide
    {
        return $this->repository->create([
            'restaurant_id' => $restaurantId,
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'image_path' => $data['image_path'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function update(int $restaurantId, int $slideId, array $data): MenuSlide
    {
        $slide = $this->repository->findForRestaurant($slideId, $restaurantId);

        if (! $slide) {
            throw new NotFoundHttpException('Slayt bulunamadı.');
        }

        if (array_key_exists('image_path', $data) && $data['image_path'] !== $slide->image_path) {
            $this->uploadService->delete($slide->image_path);
        }

        return $this->repository->update($slide, $data);
    }

    public function delete(int $restaurantId, int $slideId): void
    {
        $slide = $this->repository->findForRestaurant($slideId, $restaurantId);

        if (! $slide) {
            throw new NotFoundHttpException('Slayt bulunamadı.');
        }

        $this->uploadService->delete($slide->image_path);
        $this->repository->delete($slide);
    }
}
