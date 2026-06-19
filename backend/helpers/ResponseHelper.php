<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - JSON Response Helper
|--------------------------------------------------------------------------
|
| Tüm controller'lar tarafından kullanılan ortak JSON response metotları.
| DRY prensibi: Tekrarlanan response kodunu merkeze toplar.
|
|--------------------------------------------------------------------------
*/

class ResponseHelper
{
    /**
     * Başarılı JSON response
     */
    public static function success(array $data = [], int $statusCode = 200): void
    {
        http_response_code($statusCode);
        echo json_encode(
            array_merge(['status' => 'success'], $data),
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Hata JSON response
     */
    public static function error(string $message, int $statusCode = 400, array $extra = []): void
    {
        http_response_code($statusCode);
        echo json_encode(
            array_merge(['status' => 'error', 'message' => $message], $extra),
            JSON_UNESCAPED_UNICODE
        );
    }

    /**
     * Validasyon hatası response
     */
    public static function validationError(array $errors): void
    {
        http_response_code(422);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Validasyon hatası.',
            'errors'  => $errors,
        ], JSON_UNESCAPED_UNICODE);
    }
}
