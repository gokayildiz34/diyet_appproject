<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Checkin Controller
|--------------------------------------------------------------------------
|
| Endpoint'ler:
|   POST   /api/checkins      → Yeni check-in
|   GET    /api/checkins       → Kullanıcının check-in'leri
|   DELETE /api/checkins/{id}  → Check-in sil
|
|--------------------------------------------------------------------------
*/

class CheckinController
{
    private WeeklyCheckin $checkinModel;

    public function __construct(PDO $db)
    {
        $this->checkinModel = new WeeklyCheckin($db);
    }

    /** POST /api/checkins */
    public function create(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();

        if (empty($payload['weight_kg'])) {
            ResponseHelper::error('weight_kg alanı zorunludur.', 422);
            return;
        }

        $checkin = $this->checkinModel->create($userId, $payload);
        ResponseHelper::success(['checkin' => $checkin], 201);
    }

    /** GET /api/checkins */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $checkins = $this->checkinModel->getByUserId($userId);
        ResponseHelper::success(['checkins' => $checkins]);
    }

    /** DELETE /api/checkins/{id} */
    public function delete(int $id): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->checkinModel->delete($id, $userId)) {
            ResponseHelper::error('Check-in bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Check-in silindi.']);
    }
}
