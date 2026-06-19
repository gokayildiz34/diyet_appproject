<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Auth Middleware
|--------------------------------------------------------------------------
|
| JWT token doğrulama middleware'i.
| Korumalı endpoint'lere erişimden önce token kontrolü yapar.
|
| Görevleri:
|   - Authorization header'dan Bearer token okuma
|   - JWT token'ı çözme ve doğrulama
|   - Geçersiz/eksik token → 401 Unauthorized response
|   - Geçerli token → user_id döndürme
|
|--------------------------------------------------------------------------
*/

class AuthMiddleware
{
    /**
     * Authorization header'dan Bearer token'ı al ve doğrula
     *
     * @return int User ID (token geçerliyse)
     *             Geçersiz/eksik token durumunda 401 response ile çıkış yapar
     */
    public static function authenticate(): int
    {
        $token = self::extractBearerToken();

        if ($token === null) {
            self::unauthorized('Token bulunamadı. Authorization header gerekli.');
        }

        $secret = getenv('JWT_SECRET') ?: 'default-secret-change-me';

        $payload = JWTHelper::decode($token, $secret);

        if ($payload === null) {
            self::unauthorized('Geçersiz veya süresi dolmuş token.');
        }

        if (!isset($payload['user_id'])) {
            self::unauthorized('Token payload geçersiz.');
        }

        return (int) $payload['user_id'];
    }

    /**
     * Authorization header'dan Bearer token'ı çıkar
     */
    private static function extractBearerToken(): ?string
    {
        // Apache ve Nginx uyumluluğu
        $authHeader = null;

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if ($authHeader === null) {
            return null;
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = trim(substr($authHeader, 7));

        return $token !== '' ? $token : null;
    }

    /**
     * 401 Unauthorized response döndür ve çık
     */
    private static function unauthorized(string $message): never
    {
        http_response_code(401);
        echo json_encode([
            'status'  => 'error',
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
