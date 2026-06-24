<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - API Route Tanımları
|--------------------------------------------------------------------------
|
| Tüm API route'ları bu dosyada tanımlanır.
| public/index.php tarafından include edilir.
|
| Değişkenler (index.php'den gelir):
|   $segments      - URL parçaları (array)
|   $requestMethod - HTTP metodu (GET, POST, PUT, DELETE)
|   $jsonBody      - JSON request body (array)
|   $getDb         - Lazy database bağlantısı (callable)
|
|--------------------------------------------------------------------------
*/

// =============================================
// AUTH ROUTES — /api/auth/*
// =============================================
if (($segments[0] ?? '') === 'auth') {
    $authController = new AuthController($getDb());

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'register') {
        $authController->register($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'login') {
        $authController->login($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'verify-email') {
        $authController->verifyEmail($jsonBody);
        exit();
    }

    if ($requestMethod === 'GET' && ($segments[1] ?? '') === 'me') {
        $authController->me();
        exit();
    }

    if ($requestMethod === 'PUT' && ($segments[1] ?? '') === 'profile') {
        $authController->updateProfile($jsonBody);
        exit();
    }

    if ($requestMethod === 'PUT' && ($segments[1] ?? '') === 'password') {
        $authController->changePassword($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'forgot-password') {
        $authController->forgotPassword($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'reset-password') {
        $authController->resetPassword($jsonBody);
        exit();
    }
}

// =============================================
// FOOD LOG ROUTES — /api/food-log/*
// =============================================
if (($segments[0] ?? '') === 'food-log') {
    $foodLogController = new FoodLogController($getDb());
    $logId = isset($segments[1]) && is_numeric($segments[1]) ? (int) $segments[1] : 0;

    // GET /api/food-log/weekly?from=...
    if ($requestMethod === 'GET' && ($segments[1] ?? '') === 'weekly') {
        $foodLogController->weekly();
        exit();
    }

    // POST /api/food-log/copy-from-yesterday
    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'copy-from-yesterday') {
        $foodLogController->copyFromYesterday($jsonBody);
        exit();
    }

    // GET /api/food-log/search?q=...
    if ($requestMethod === 'GET' && ($segments[1] ?? '') === 'search') {
        $foodLogController->search();
        exit();
    }

    // GET /api/food-log?date=...
    if ($requestMethod === 'GET' && $logId === 0) {
        $foodLogController->index();
        exit();
    }

    // POST /api/food-log
    if ($requestMethod === 'POST' && $logId === 0) {
        $foodLogController->store($jsonBody);
        exit();
    }

    // DELETE /api/food-log/{id}
    if ($requestMethod === 'DELETE' && $logId > 0) {
        $foodLogController->destroy($logId);
        exit();
    }
}

// =============================================
// WATER ROUTES — /api/water
// =============================================
if (($segments[0] ?? '') === 'water') {
    $foodLogController = new FoodLogController($getDb());

    if ($requestMethod === 'GET') {
        $foodLogController->getWater();
        exit();
    }

    if ($requestMethod === 'POST') {
        $foodLogController->upsertWater($jsonBody);
        exit();
    }
}

// =============================================
// FEED ROUTES — /api/feed/*
// =============================================
if (($segments[0] ?? '') === 'feed') {
    $feedController = new FeedController($getDb());
    $feedId = isset($segments[1]) ? (int) $segments[1] : 0;
    $feedAction = $segments[2] ?? '';

    // GET /api/feed
    if ($requestMethod === 'GET' && !isset($segments[1])) {
        $feedController->index();
        exit();
    }

    // POST /api/feed
    if ($requestMethod === 'POST' && !isset($segments[1])) {
        $feedController->create($jsonBody);
        exit();
    }

    // DELETE /api/feed/{id}
    if ($requestMethod === 'DELETE' && $feedId > 0 && $feedAction === '') {
        $feedController->delete($feedId);
        exit();
    }

    // POST /api/feed/{id}/like
    if ($requestMethod === 'POST' && $feedId > 0 && $feedAction === 'like') {
        $feedController->like($feedId);
        exit();
    }

    // DELETE /api/feed/{id}/like
    if ($requestMethod === 'DELETE' && $feedId > 0 && $feedAction === 'like') {
        $feedController->unlike($feedId);
        exit();
    }

    // POST /api/feed/{id}/support
    if ($requestMethod === 'POST' && $feedId > 0 && $feedAction === 'support') {
        $feedController->support($feedId);
        exit();
    }

    // DELETE /api/feed/{id}/support
    if ($requestMethod === 'DELETE' && $feedId > 0 && $feedAction === 'support') {
        $feedController->unsupport($feedId);
        exit();
    }

    // GET /api/feed/{id}/comments
    if ($requestMethod === 'GET' && $feedId > 0 && $feedAction === 'comments') {
        $feedController->getComments($feedId);
        exit();
    }

    // POST /api/feed/{id}/comments
    if ($requestMethod === 'POST' && $feedId > 0 && $feedAction === 'comments') {
        $feedController->addComment($feedId, $jsonBody);
        exit();
    }
}

// =============================================
// DIET PLAN ROUTES — /api/diet-plans/*
// =============================================
if (($segments[0] ?? '') === 'diet-plans') {
    $dietController = new DietPlanController($getDb());

    // GET /api/diet-plans/latest
    if ($requestMethod === 'GET' && ($segments[1] ?? '') === 'latest') {
        $dietController->latest();
        exit();
    }

    // GET /api/diet-plans
    if ($requestMethod === 'GET' && !isset($segments[1])) {
        $dietController->index();
        exit();
    }

    // POST /api/diet-plans
    if ($requestMethod === 'POST' && !isset($segments[1])) {
        $dietController->create($jsonBody);
        exit();
    }
}

// =============================================
// CHECKIN ROUTES — /api/checkins/*
// =============================================
if (($segments[0] ?? '') === 'checkins') {
    $checkinController = new CheckinController($getDb());
    $checkinId = isset($segments[1]) ? (int) $segments[1] : 0;

    // GET /api/checkins
    if ($requestMethod === 'GET' && !isset($segments[1])) {
        $checkinController->index();
        exit();
    }

    // POST /api/checkins
    if ($requestMethod === 'POST' && !isset($segments[1])) {
        $checkinController->create($jsonBody);
        exit();
    }

    // DELETE /api/checkins/{id}
    if ($requestMethod === 'DELETE' && $checkinId > 0) {
        $checkinController->delete($checkinId);
        exit();
    }
}

// =============================================
// FRIENDSHIP ROUTES — /api/friends/*
// =============================================
if (($segments[0] ?? '') === 'friends') {
    $friendController = new FriendshipController($getDb());
    $friendAction = $segments[1] ?? '';
    $friendId = isset($segments[2]) ? (int) $segments[2] : 0;

    // POST /api/friends/request
    if ($requestMethod === 'POST' && $friendAction === 'request') {
        $friendController->sendRequest($jsonBody);
        exit();
    }

    // POST /api/friends/accept/{id}
    if ($requestMethod === 'POST' && $friendAction === 'accept' && $friendId > 0) {
        $friendController->accept($friendId);
        exit();
    }

    // POST /api/friends/decline/{id}
    if ($requestMethod === 'POST' && $friendAction === 'decline' && $friendId > 0) {
        $friendController->decline($friendId);
        exit();
    }

    // GET /api/friends/requests
    if ($requestMethod === 'GET' && $friendAction === 'requests') {
        $friendController->pendingRequests();
        exit();
    }

    // GET /api/friends
    if ($requestMethod === 'GET' && $friendAction === '') {
        $friendController->index();
        exit();
    }

    // DELETE /api/friends/{id}
    if ($requestMethod === 'DELETE' && $friendAction !== '' && (int) $friendAction > 0) {
        $friendController->remove((int) $friendAction);
        exit();
    }
}

// =============================================
// AI COACH ROUTES — /api/ai/*
// =============================================
if (($segments[0] ?? '') === 'ai') {
    $aiCoachController = new AICoachController();

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'coach-chat') {
        $aiCoachController->coachChat($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'analyze-food') {
        $aiCoachController->analyzeFood($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'analyze-food-image') {
        $aiCoachController->analyzeFoodImage($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'coach-comment-feed-image') {
        $aiCoachController->coachCommentFeedImage($jsonBody);
        exit();
    }
}

// =============================================
// PAYMENT ROUTES — /api/payments/*
// =============================================
if (($segments[0] ?? '') === 'payments') {
    $paymentController = new PaymentController($getDb());

    if ($requestMethod === 'GET' && ($segments[1] ?? '') === 'plans') {
        $paymentController->getPlans();
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'checkout-session') {
        $paymentController->createCheckoutSession($jsonBody);
        exit();
    }

    if ($requestMethod === 'POST' && ($segments[1] ?? '') === 'webhook') {
        $paymentController->handleWebhook();
        exit();
    }
}

// =============================================
// NOTIFICATION ROUTES — /api/notifications/*
// =============================================
if (($segments[0] ?? '') === 'notifications') {
    $notifController = new NotificationController($getDb());
    $notifAction = $segments[1] ?? '';
    $notifId = isset($segments[1]) ? (int) $segments[1] : 0;
    $notifSubAction = $segments[2] ?? '';

    // GET /api/notifications
    if ($requestMethod === 'GET' && $notifAction === '') {
        $notifController->index();
        exit();
    }

    // PUT /api/notifications/read-all
    if ($requestMethod === 'PUT' && $notifAction === 'read-all') {
        $notifController->markAllAsRead();
        exit();
    }

    // PUT /api/notifications/{id}/read
    if ($requestMethod === 'PUT' && $notifId > 0 && $notifSubAction === 'read') {
        $notifController->markAsRead($notifId);
        exit();
    }

    // DELETE /api/notifications/{id}
    if ($requestMethod === 'DELETE' && $notifId > 0) {
        $notifController->deleteNotification($notifId);
        exit();
    }

    // POST /api/notifications/send (OneSignal push)
    if ($requestMethod === 'POST' && $notifAction === 'send') {
        $notifController->sendToUser($jsonBody);
        exit();
    }

    // POST /api/notifications/broadcast (OneSignal push)
    if ($requestMethod === 'POST' && $notifAction === 'broadcast') {
        $notifController->broadcast($jsonBody);
        exit();
    }
}

// =============================================
// FILE UPLOAD ROUTE — /api/upload
// =============================================
if (($segments[0] ?? '') === 'upload' && $requestMethod === 'POST') {
    $userId = AuthMiddleware::authenticate();

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        ResponseHelper::error('Dosya yüklenemedi.', 422);
        exit();
    }

    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes, true)) {
        ResponseHelper::error('Sadece JPEG, PNG, GIF ve WebP formatları desteklenir.', 422);
        exit();
    }

    // Max 5MB
    if ($file['size'] > 5 * 1024 * 1024) {
        ResponseHelper::error('Dosya boyutu en fazla 5MB olabilir.', 422);
        exit();
    }

    $ext = match ($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    $filename = uniqid('img_', true) . '.' . $ext;
    $uploadDir = __DIR__ . '/../public/uploads/';
    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        ResponseHelper::error('Dosya kaydedilemedi.', 500);
        exit();
    }

    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
        . '://' . $_SERVER['HTTP_HOST'];
    $imageUrl = $baseUrl . '/uploads/' . $filename;

    ResponseHelper::success(['url' => $imageUrl], 201);
    exit();
}
