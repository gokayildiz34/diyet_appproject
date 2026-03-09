<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Ana Giriş Noktası (Entry Point)
|--------------------------------------------------------------------------
|
| Bu dosya, backend uygulamasının tek giriş noktasıdır (Single Entry Point).
| Tüm HTTP istekleri .htaccess tarafından bu dosyaya yönlendirilir.
|
| Görevleri:
|   - CORS (Cross-Origin Resource Sharing) başlıklarını ayarlamak
|   - React frontend'den gelen isteklere izin vermek
|   - Gelen isteğin URL'sini parse edip doğru controller'a yönlendirmek
|   - Basit bir router mekanizması sağlamak
|   - Preflight (OPTIONS) isteklerini karşılamak
|
| Çalıştırma:
|   php -S localhost:8000 (bu dizinde)
|
|--------------------------------------------------------------------------
*/

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Base path'i çıkar
$basePath = '/';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

// Basit router
$segments = explode('/', $path);

// Ana sayfa
if (empty($path)) {
    echo json_encode([
        "status" => "success",
        "message" => "Diyet App API çalışıyor",
        "version" => "1.0.0"
    ]);
    exit();
}

// 404 - Route bulunamadı
http_response_code(404);
echo json_encode([
    "status" => "error",
    "message" => "Endpoint bulunamadı"
]);
