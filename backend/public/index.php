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
|   1. CORS başlıklarını ayarla
|   2. .env dosyasını yükle
|   3. Gerekli dosyaları include et (autoload)
|   4. URL'i parse et
|   5. Route dosyasına yönlendir
|
| Çalıştırma:
|   php -S localhost:8000 -t backend/public
|
|--------------------------------------------------------------------------
*/

// =============================================
// 1. CORS HEADERS
// =============================================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://fitplate.xo.je',
    'https://fitplate.xo.je',
    'http://www.fitplate.xo.je',
    'https://www.fitplate.xo.je',
    'http://localhost:5173',
    'http://localhost:3000',
];
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://fitplate.xo.je");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =============================================
// 2. AUTOLOAD — Config
// =============================================
require_once __DIR__ . '/../config/env.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/JWTHelper.php';

// =============================================
// 3. AUTOLOAD — Helpers
// =============================================
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/../helpers/ResendMailer.php';

// =============================================
// 4. AUTOLOAD — Middleware
// =============================================
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

// =============================================
// 5. AUTOLOAD — Models
// =============================================
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Post.php';
require_once __DIR__ . '/../models/DietPlan.php';
require_once __DIR__ . '/../models/WeeklyCheckin.php';
require_once __DIR__ . '/../models/Friendship.php';
require_once __DIR__ . '/../models/Notification.php';

// =============================================
// 6. AUTOLOAD — Controllers
// =============================================
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/FeedController.php';
require_once __DIR__ . '/../controllers/DietPlanController.php';
require_once __DIR__ . '/../controllers/CheckinController.php';
require_once __DIR__ . '/../controllers/FriendshipController.php';
require_once __DIR__ . '/../controllers/AICoachController.php';
require_once __DIR__ . '/../controllers/PaymentController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/FoodLogController.php';

// =============================================
// 7. ENV YÜKLEME
// =============================================
loadEnv(__DIR__ . '/../.env');

// =============================================
// 8. URL PARSE
// =============================================
$requestUri    = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

$path = trim(parse_url($requestUri, PHP_URL_PATH) ?? '', '/');

// /api prefix'ini normalize et
if (str_starts_with($path, 'api/')) {
    $path = substr($path, 4);
} elseif ($path === 'api') {
    $path = '';
}

$segments = $path === '' ? [] : explode('/', $path);

// JSON body parse
$rawBody = file_get_contents('php://input') ?: '';
$jsonBody = json_decode($rawBody, true);
if (!is_array($jsonBody)) {
    $jsonBody = [];
}

// =============================================
// 9. ANA SAYFA
// =============================================
if (empty($path)) {
    ResponseHelper::success([
        'message' => 'Diyet App API çalışıyor',
        'version' => '1.0.0',
    ]);
    exit();
}

// =============================================
// 10. LAZY DATABASE
// =============================================
$db = null;
$getDb = function () use (&$db) {
    if ($db === null) {
        $database = new Database();
        $db = $database->getConnection();
    }
    return $db;
};

// =============================================
// 11. ROUTE DOSYASINI YÜKLE
// =============================================
require_once __DIR__ . '/../routes/api.php';
require_once __DIR__ . '/../routes/users.php';

// =============================================
// 12. 404 — Route bulunamadı
// =============================================
ResponseHelper::error('Endpoint bulunamadı', 404);
