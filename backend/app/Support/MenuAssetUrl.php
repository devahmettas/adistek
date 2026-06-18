<?php

namespace App\Support;

use Illuminate\Support\Facades\Request;

class MenuAssetUrl
{
    public static function resolve(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return self::rewriteLegacyUrl($path) ?? $path;
        }

        $normalizedPath = self::normalizeStoragePath($path);

        if ($normalizedPath === null) {
            return null;
        }

        return self::buildMediaUrl($normalizedPath);
    }

    public static function normalizeStoragePath(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $parsedPath = parse_url($path, PHP_URL_PATH);

            if (! is_string($parsedPath) || $parsedPath === '') {
                return null;
            }

            $path = $parsedPath;
        }

        $normalized = str_replace('\\', '/', $path);
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

    public static function buildMediaUrl(string $normalizedPath): string
    {
        $encodedPath = implode('/', array_map(
            rawurlencode(...),
            explode('/', $normalizedPath),
        ));

        $baseUrl = self::resolveBaseUrl();

        return "{$baseUrl}/api/media/{$encodedPath}";
    }

    private static function resolveBaseUrl(): string
    {
        if (! app()->runningInConsole() && Request::hasHeader('Host')) {
            return rtrim(Request::getSchemeAndHttpHost(), '/');
        }

        return rtrim((string) config('app.url'), '/');
    }

    private static function rewriteLegacyUrl(string $url): ?string
    {
        $path = self::normalizeStoragePath($url);

        if ($path === null) {
            return null;
        }

        return self::buildMediaUrl($path);
    }
}
