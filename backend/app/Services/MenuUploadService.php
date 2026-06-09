<?php

namespace App\Services;

use App\Support\MenuAssetUrl;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class MenuUploadService
{
    private const MAX_SIZE_KB = 5120;

    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    public function upload(int $restaurantId, UploadedFile $file, string $context): array
    {
        if (! in_array($context, ['product', 'slide', 'category'], true)) {
            throw new UnprocessableEntityHttpException('Geçersiz yükleme türü.');
        }

        if (! $this->isAllowedImage($file)) {
            throw new UnprocessableEntityHttpException('Yalnızca JPG, JPEG, PNG veya WebP görselleri yüklenebilir.');
        }

        if ($file->getSize() > self::MAX_SIZE_KB * 1024) {
            throw new UnprocessableEntityHttpException('Görsel boyutu en fazla 5 MB olabilir.');
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $filename = Str::uuid().'.'.$extension;
        $directoryNames = [
            'product' => 'products',
            'slide' => 'slides',
            'category' => 'categories',
        ];
        $directory = "menu/{$restaurantId}/{$directoryNames[$context]}";
        $path = $file->storeAs($directory, $filename, 'public');

        return [
            'path' => $path,
            'url' => MenuAssetUrl::resolve($path),
        ];
    }

    public function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function isAllowedImage(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            return false;
        }

        $mime = strtolower((string) $file->getMimeType());

        if ($mime === '' || $mime === 'application/octet-stream') {
            return true;
        }

        $allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/pjpeg',
            'image/png',
            'image/x-png',
            'image/webp',
        ];

        return in_array($mime, $allowedMimes, true);
    }
}
