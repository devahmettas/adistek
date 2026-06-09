<?php

namespace App\Services;

use App\Support\LocalizedText;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MenuTranslationService
{
    private const MAX_CHUNK_LENGTH = 450;

    private const MAX_CONCURRENT_REQUESTS = 8;

    public function translate(?string $text, string $targetLang): ?string
    {
        $results = $this->translateMany([$text ?? ''], $targetLang);
        $text = is_string($text) ? trim($text) : '';

        return $results[$text] ?? $text;
    }

    /**
     * @param  array<int, string|null>  $texts
     * @return array<string, string>
     */
    public function translateMany(array $texts, string $targetLang): array
    {
        $targetLang = LocalizedText::normalizeLang($targetLang);
        $normalizedTexts = collect($texts)
            ->filter(fn ($text) => is_string($text) && trim($text) !== '')
            ->map(fn (string $text) => trim($text))
            ->unique()
            ->values();

        if ($targetLang === 'tr' || $normalizedTexts->isEmpty()) {
            return $normalizedTexts->mapWithKeys(fn (string $text) => [$text => $text])->all();
        }

        if (! config('translation.enabled')) {
            return $normalizedTexts->mapWithKeys(fn (string $text) => [$text => $text])->all();
        }

        $results = [];
        $pending = [];

        foreach ($normalizedTexts as $text) {
            $cacheKey = $this->cacheKey($text, $targetLang);
            $cached = Cache::get($cacheKey);

            if (is_string($cached) && $cached !== '') {
                $results[$text] = $cached;
            } else {
                $pending[] = $text;
            }
        }

        foreach (array_chunk($pending, self::MAX_CONCURRENT_REQUESTS) as $chunk) {
            $chunkResults = $this->translateChunkInParallel($chunk, $targetLang);

            foreach ($chunkResults as $original => $translated) {
                $results[$original] = $translated;

                if ($translated !== $original) {
                    Cache::put(
                        $this->cacheKey($original, $targetLang),
                        $translated,
                        config('translation.cache_ttl'),
                    );
                }
            }
        }

        return $results;
    }

    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    private function translateChunkInParallel(array $texts, string $targetLang): array
    {
        $results = [];
        $simpleTexts = [];

        foreach ($texts as $text) {
            if (mb_strlen($text) > self::MAX_CHUNK_LENGTH) {
                $results[$text] = $this->requestTranslation($text, $targetLang) ?? $text;
                continue;
            }

            $simpleTexts[md5($text)] = $text;
        }

        if ($simpleTexts === []) {
            return $results;
        }

        $timeout = config('translation.request_timeout');
        $verifySsl = config('translation.verify_ssl');

        $responses = Http::pool(function (Pool $pool) use ($simpleTexts, $targetLang, $timeout, $verifySsl) {
            foreach ($simpleTexts as $hash => $text) {
                $request = $pool->as($hash)->timeout($timeout);

                if (! $verifySsl) {
                    $request = $request->withoutVerifying();
                }

                $request->get('https://translate.googleapis.com/translate_a/single', [
                    'client' => 'gtx',
                    'sl' => config('translation.source_lang'),
                    'tl' => $targetLang,
                    'dt' => 't',
                    'q' => $text,
                ]);
            }
        });

        foreach ($simpleTexts as $hash => $text) {
            $response = $responses[$hash] ?? null;
            $translated = $this->parseGoogleResponse($response);

            if ($translated === null) {
                $translated = $this->requestProviders($text, $targetLang);
            }

            $results[$text] = $translated ?? $text;
        }

        return $results;
    }

    private function parseGoogleResponse(mixed $response): ?string
    {
        if (! $response || ! method_exists($response, 'successful') || ! $response->successful()) {
            return null;
        }

        $data = $response->json();

        if (! is_array($data) || ! isset($data[0][0][0])) {
            return null;
        }

        $translated = trim((string) $data[0][0][0]);

        return $translated === '' ? null : $translated;
    }

    private function requestTranslation(string $text, string $targetLang): ?string
    {
        if (mb_strlen($text) <= self::MAX_CHUNK_LENGTH) {
            return $this->requestProviders($text, $targetLang);
        }

        $chunks = $this->splitText($text);
        $translatedChunks = [];

        foreach ($chunks as $chunk) {
            $translatedChunk = $this->requestProviders($chunk, $targetLang);

            if ($translatedChunk === null) {
                return null;
            }

            $translatedChunks[] = $translatedChunk;
        }

        return implode(' ', $translatedChunks);
    }

    private function requestProviders(string $text, string $targetLang): ?string
    {
        $google = $this->requestGoogle($text, $targetLang);

        if ($google !== null) {
            return $google;
        }

        return $this->requestMyMemory($text, $targetLang);
    }

    private function requestGoogle(string $text, string $targetLang): ?string
    {
        try {
            $response = $this->httpClient()->get('https://translate.googleapis.com/translate_a/single', [
                'client' => 'gtx',
                'sl' => config('translation.source_lang'),
                'tl' => $targetLang,
                'dt' => 't',
                'q' => $text,
            ]);

            if (! $response->successful()) {
                return null;
            }

            $data = $response->json();

            if (! is_array($data) || ! isset($data[0][0][0])) {
                return null;
            }

            $translated = trim((string) $data[0][0][0]);

            return $translated === '' ? null : $translated;
        } catch (\Throwable $exception) {
            Log::debug('Google menu translation failed.', [
                'target_lang' => $targetLang,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function requestMyMemory(string $text, string $targetLang): ?string
    {
        try {
            $response = $this->httpClient()->get('https://api.mymemory.translated.net/get', [
                'q' => $text,
                'langpair' => config('translation.source_lang').'|'.$targetLang,
                'de' => config('translation.mymemory_email'),
            ]);

            if (! $response->successful()) {
                return null;
            }

            $translated = $response->json('responseData.translatedText');

            if (! is_string($translated) || trim($translated) === '') {
                return null;
            }

            $translated = trim($translated);

            if (str_contains(strtoupper($translated), 'MYMEMORY WARNING')) {
                return null;
            }

            return $translated;
        } catch (\Throwable $exception) {
            Log::debug('MyMemory menu translation failed.', [
                'target_lang' => $targetLang,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function httpClient(): PendingRequest
    {
        $client = Http::timeout(config('translation.request_timeout'));

        if (! config('translation.verify_ssl')) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    /**
     * @return array<int, string>
     */
    private function splitText(string $text): array
    {
        $parts = preg_split('/(?<=[.!?])\s+/u', $text) ?: [$text];
        $chunks = [];
        $current = '';

        foreach ($parts as $part) {
            $part = trim($part);

            if ($part === '') {
                continue;
            }

            $candidate = $current === '' ? $part : $current.' '.$part;

            if (mb_strlen($candidate) <= self::MAX_CHUNK_LENGTH) {
                $current = $candidate;
                continue;
            }

            if ($current !== '') {
                $chunks[] = $current;
            }

            if (mb_strlen($part) <= self::MAX_CHUNK_LENGTH) {
                $current = $part;
                continue;
            }

            foreach (mb_str_split($part, self::MAX_CHUNK_LENGTH) as $slice) {
                $chunks[] = $slice;
            }

            $current = '';
        }

        if ($current !== '') {
            $chunks[] = $current;
        }

        return $chunks === [] ? [$text] : $chunks;
    }

    private function cacheKey(string $text, string $targetLang): string
    {
        return 'menu_translation:'.md5($text).':'.$targetLang;
    }
}
