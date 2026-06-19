<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - User Routes
|--------------------------------------------------------------------------
|
| GET /api/users/search?q=xxx  → Kullanıcı arama
|
|--------------------------------------------------------------------------
*/

if (($segments[0] ?? '') === 'users') {
    $userController = new UserController($getDb());
    $userAction = $segments[1] ?? '';

    // GET /api/users/search?q=xxx
    if ($requestMethod === 'GET' && $userAction === 'search') {
        $userController->search();
        exit();
    }
}
