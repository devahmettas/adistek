<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PublicMediaController extends Controller
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/pjpeg',
        'image/png',
        'image/x-png',
        'image/webp',
    ];

    public function show(string $path): Response|BinaryFileResponse
    {
        $normalizedPath = $this->normalizePath($path);

        if ($normalizedPath === null || ! $this->isAllowedPath($normalizedPath)) {
            abort(404);
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($normalizedPath)) {
            abort(404);
        }

        $mimeType = $this->resolveMimeType($normalizedPath, (string) $disk->mimeType($normalizedPath));

        if (! in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            abort(404);
        }

        return response()->file($disk->path($normalizedPath), [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    private function normalizePath(string $path): ?string
    {
        $normalized = str_replace('\\', '/', urldecode($path));
        $normalized = ltrim($normalized, '/');

        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        if (str_starts_with($normalized, 'api/media/')) {
            $normalized = substr($normalized, strlen('api/media/'));
        }

        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }

        return $normalized !== '' ? $normalized : null;
    }

    private function isAllowedPath(string $path): bool
    {
        return preg_match(
            '#^(?:(?:menu|jewelry)/[0-9]+/(?:products|categories|slides)|products)/[A-Za-z0-9._-]+$#',
            $path,
        ) === 1;
    }

    private function resolveMimeType(string $path, string $detected): string
    {
        $detected = strtolower($detected);

        if (in_array($detected, self::ALLOWED_MIME_TYPES, true)) {
            return $detected;
        }

        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => $detected,
        };
    }
}
