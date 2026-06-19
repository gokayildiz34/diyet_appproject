<?php

/**
 * FitPlate - User Controller
 * Kullanıcı arama ve profil görüntüleme işlemleri
 *
 * Endpoint'ler:
 *   GET /api/users/search?q=xxx  → Kullanıcı arama
 */

class UserController
{
    private User $userModel;

    public function __construct(PDO $db)
    {
        $this->userModel = new User($db);
    }

    /**
     * GET /api/users/search?q=xxx
     * Keşfet sayfası için kullanıcı arama
     */
    public function search(): void
    {
        $userId = AuthMiddleware::authenticate();
        $query = trim((string) ($_GET['q'] ?? ''));

        if ($query === '' || mb_strlen($query) < 2) {
            ResponseHelper::success(['users' => []]);
            return;
        }

        $users = $this->userModel->search($query, $userId, 20);

        ResponseHelper::success(['users' => $users]);
    }
}
