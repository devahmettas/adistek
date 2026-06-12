<?php

namespace App\Services\GoldPrices\Streams;

use RuntimeException;

/**
 * İZKO'nun kullandığı ozbag Socket.IO (EIO4) akışından HAS altın fiyatını dinler.
 */
class OzbagSocketIoClient
{
    private const HOST = 'veri.ozbag.com';

    private const PATH = '/socket.io/?status=true&EIO=4&transport=websocket';

    public function listen(callable $onHasPrice, ?callable $onDisconnect = null): void
    {
        $socket = $this->connect();

        try {
            $this->readLoop($socket, $onHasPrice);
        } catch (\Throwable $exception) {
            if (is_resource($socket)) {
                fclose($socket);
            }

            if ($onDisconnect) {
                $onDisconnect($exception);
            }

            throw $exception;
        }
    }

    /**
     * @return resource
     */
    private function connect()
    {
        $key = base64_encode(random_bytes(16));
        $path = self::PATH.'&rnd='.mt_rand() / mt_getrandmax();
        $header = "GET {$path} HTTP/1.1\r\n"
            .'Host: '.self::HOST."\r\n"
            ."Upgrade: websocket\r\n"
            ."Connection: Upgrade\r\n"
            ."Sec-WebSocket-Key: {$key}\r\n"
            ."Sec-WebSocket-Version: 13\r\n"
            ."User-Agent: Adistek-GoldWatcher/1.0\r\n\r\n";

        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => (bool) config('gold_prices.verify_ssl', true),
                'verify_peer_name' => (bool) config('gold_prices.verify_ssl', true),
                'SNI_enabled' => true,
                'peer_name' => self::HOST,
            ],
        ]);

        $socket = @stream_socket_client(
            'ssl://'.self::HOST.':443',
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT,
            $context,
        );

        if (! is_resource($socket)) {
            throw new RuntimeException("Ozbag bağlantısı kurulamadı: {$errstr} ({$errno})");
        }

        stream_set_timeout($socket, 30);
        fwrite($socket, $header);

        $response = '';
        while (! str_contains($response, "\r\n\r\n")) {
            $chunk = fread($socket, 1024);
            if ($chunk === false || $chunk === '') {
                throw new RuntimeException('Ozbag el sıkışması tamamlanamadı.');
            }
            $response .= $chunk;
        }

        if (! str_contains($response, '101')) {
            throw new RuntimeException('Ozbag WebSocket yükseltmesi başarısız.');
        }

        return $socket;
    }

    /**
     * @param  resource  $socket
     */
    private function readLoop($socket, callable $onHasPrice): void
    {
        $buffer = '';

        while (! feof($socket)) {
            $chunk = fread($socket, 8192);

            if ($chunk === false) {
                break;
            }

            if ($chunk === '') {
                $meta = stream_get_meta_data($socket);
                if ($meta['timed_out'] ?? false) {
                    stream_set_timeout($socket, 30);
                }
                continue;
            }

            $buffer .= $chunk;

            while ($buffer !== '') {
                $frame = $this->decodeFrame($buffer);

                if ($frame === null) {
                    break;
                }

                if ($frame === false) {
                    return;
                }

                $this->handleMessage($socket, $frame, $onHasPrice);
            }
        }
    }

    /**
     * @param  resource  $socket
     */
    private function handleMessage($socket, string $message, callable $onHasPrice): void
    {
        if ($message === '2') {
            fwrite($socket, $this->encodeClientTextFrame('3'));

            return;
        }

        if (str_starts_with($message, '0')) {
            fwrite($socket, $this->encodeClientTextFrame('40'));

            return;
        }

        if (! str_starts_with($message, '42')) {
            return;
        }

        $payload = json_decode(substr($message, 2), true);

        if (! is_array($payload) || ($payload[0] ?? null) !== 'prices' || ! is_array($payload[1] ?? null)) {
            return;
        }

        foreach ($payload[1] as $item) {
            $code = strtoupper((string) ($item['Code'] ?? $item['Symbol'] ?? ''));
            if ($code !== 'HAS') {
                continue;
            }

            $price = (float) ($item['Ask'] ?? 0);
            if ($price > 0) {
                $onHasPrice($price);
            }
        }
    }

    /**
     * @param  resource  $socket
     */
    private function encodeClientTextFrame(string $payload): string
    {
        $length = strlen($payload);
        $frame = chr(0x81);

        if ($length <= 125) {
            $frame .= chr(0x80 | $length);
        } elseif ($length <= 65535) {
            $frame .= chr(0x80 | 126).pack('n', $length);
        } else {
            $frame .= chr(0x80 | 127).pack('J', $length);
        }

        $mask = random_bytes(4);
        $frame .= $mask;

        for ($i = 0; $i < $length; $i++) {
            $frame .= $payload[$i] ^ $mask[$i % 4];
        }

        return $frame;
    }

    /**
     * @return string|null|false null=yetersiz veri, false=bağlantı kapandı
     */
    private function decodeFrame(string &$buffer): string|null|false
    {
        if (strlen($buffer) < 2) {
            return null;
        }

        $first = ord($buffer[0]);
        $second = ord($buffer[1]);
        $opcode = $first & 0x0F;
        $masked = (bool) ($second & 0x80);
        $length = $second & 0x7F;
        $offset = 2;

        if ($length === 126) {
            if (strlen($buffer) < 4) {
                return null;
            }
            $length = unpack('n', substr($buffer, 2, 2))[1];
            $offset = 4;
        } elseif ($length === 127) {
            if (strlen($buffer) < 10) {
                return null;
            }
            $length = unpack('J', substr($buffer, 2, 8))[1];
            $offset = 10;
        }

        $maskLength = $masked ? 4 : 0;

        if (strlen($buffer) < $offset + $maskLength + $length) {
            return null;
        }

        $mask = $masked ? substr($buffer, $offset, 4) : null;
        $payload = substr($buffer, $offset + $maskLength, $length);
        $buffer = substr($buffer, $offset + $maskLength + $length);

        if ($masked && $mask !== null) {
            $unmasked = '';
            for ($i = 0; $i < $length; $i++) {
                $unmasked .= $payload[$i] ^ $mask[$i % 4];
            }
            $payload = $unmasked;
        }

        if ($opcode === 0x8) {
            return false;
        }

        if ($opcode !== 0x1) {
            return '';
        }

        return $payload;
    }
}
