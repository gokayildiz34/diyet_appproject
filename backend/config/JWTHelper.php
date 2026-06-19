<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - JWT Helper (HMAC-SHA256)
|--------------------------------------------------------------------------
|
| Composer bağımlılığı olmadan çalışan basit JWT implementasyonu.
| HMAC-SHA256 algoritması kullanarak token oluşturur ve doğrular.
|
| Görevleri:
|   - JWT token oluşturma (encode)
|   - JWT token çözme ve doğrulama (decode)
|   - Token süre kontrolü (expiration)
|
| Güvenlik:
|   - .env dosyasındaki JWT_SECRET ile imzalama
|   - Varsayılan token süresi: 7 gün
|   - Base64url encoding (URL-safe)
|
|--------------------------------------------------------------------------
*/

class JWTHelper
{
    /**
     * Varsayılan token süresi: 7 gün (saniye cinsinden)
     */
    private const DEFAULT_TTL = 60 * 60 * 24 * 7;

    /**
     * JWT token oluştur
     *
     * @param array  $payload Token payload (user_id vb.)
     * @param string $secret  HMAC secret key
     * @param int    $ttl     Token ömrü (saniye)
     * @return string JWT token string
     */
    public static function encode(array $payload, string $secret, int $ttl = self::DEFAULT_TTL): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $ttl;

        $headerEncoded  = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    /**
     * JWT token'ı çöz ve doğrula
     *
     * @param string $token  JWT token string
     * @param string $secret HMAC secret key
     * @return array|null Payload (geçerliyse) veya null (geçersizse)
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // İmza doğrulama
        $expectedSignature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
        $expectedSignatureEncoded = self::base64UrlEncode($expectedSignature);

        if (!hash_equals($expectedSignatureEncoded, $signatureEncoded)) {
            return null;
        }

        // Payload çözme
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if (!is_array($payload)) {
            return null;
        }

        // Süre kontrolü
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Base64 URL-safe encode
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode
     */
    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($data, '-_', '+/'));
    }
}
