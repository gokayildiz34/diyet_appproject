<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Friendship Controller
|--------------------------------------------------------------------------
|
| Endpoint'ler:
|   POST   /api/friends/request       → Arkadaşlık isteği gönder
|   POST   /api/friends/accept/{id}   → Kabul et
|   POST   /api/friends/decline/{id}  → Reddet
|   GET    /api/friends               → Arkadaş listesi
|   GET    /api/friends/requests      → Bekleyen istekler
|   DELETE /api/friends/{id}          → Arkadaşı sil
|
|--------------------------------------------------------------------------
*/

class FriendshipController
{
    private Friendship $friendModel;

    public function __construct(PDO $db)
    {
        $this->friendModel = new Friendship($db);
    }

    /** POST /api/friends/request */
    public function sendRequest(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();
        $addresseeId = (int) ($payload['addressee_id'] ?? 0);

        if ($addresseeId <= 0) {
            ResponseHelper::error('addressee_id zorunludur.', 422);
            return;
        }

        $result = $this->friendModel->sendRequest($userId, $addresseeId);

        if ($result === null) {
            ResponseHelper::error('İstek gönderilemedi. Zaten bir ilişki mevcut veya kendinize istek gönderemezsiniz.', 409);
            return;
        }

        ResponseHelper::success(['friendship' => $result], 201);
    }

    /** POST /api/friends/accept/{id} */
    public function accept(int $requestId): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->friendModel->acceptRequest($requestId, $userId)) {
            ResponseHelper::error('İstek bulunamadı veya zaten işlenmiş.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Arkadaşlık isteği kabul edildi.']);
    }

    /** POST /api/friends/decline/{id} */
    public function decline(int $requestId): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->friendModel->declineRequest($requestId, $userId)) {
            ResponseHelper::error('İstek bulunamadı veya zaten işlenmiş.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Arkadaşlık isteği reddedildi.']);
    }

    /** GET /api/friends */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $friends = $this->friendModel->getFriends($userId);
        ResponseHelper::success(['friends' => $friends]);
    }

    /** GET /api/friends/requests */
    public function pendingRequests(): void
    {
        $userId = AuthMiddleware::authenticate();
        $received = $this->friendModel->getPendingRequests($userId);
        $sent = $this->friendModel->getSentRequests($userId);
        ResponseHelper::success(['received' => $received, 'sent' => $sent]);
    }

    /** DELETE /api/friends/{id} */
    public function remove(int $friendId): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->friendModel->removeFriend($userId, $friendId)) {
            ResponseHelper::error('Arkadaş bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Arkadaş silindi.']);
    }
}
