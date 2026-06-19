<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - DietPlan Controller
|--------------------------------------------------------------------------
|
| Endpoint'ler:
|   POST /api/diet-plans        → Yeni plan kaydet
|   GET  /api/diet-plans        → Kullanıcının planları
|   GET  /api/diet-plans/latest → En son plan
|
|--------------------------------------------------------------------------
*/

class DietPlanController
{
    private DietPlan $planModel;

    public function __construct(PDO $db)
    {
        $this->planModel = new DietPlan($db);
    }

    /** POST /api/diet-plans */
    public function create(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();

        if (empty($payload['total_calories'])) {
            ResponseHelper::error('total_calories alanı zorunludur.', 422);
            return;
        }

        $plan = $this->planModel->create($userId, $payload);
        ResponseHelper::success(['plan' => $plan], 201);
    }

    /** GET /api/diet-plans */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $plans = $this->planModel->getByUserId($userId);
        ResponseHelper::success(['plans' => $plans]);
    }

    /** GET /api/diet-plans/latest */
    public function latest(): void
    {
        $userId = AuthMiddleware::authenticate();
        $plan = $this->planModel->getLatest($userId);

        if ($plan === null) {
            ResponseHelper::error('Henüz bir diyet planınız yok.', 404);
            return;
        }

        ResponseHelper::success(['plan' => $plan]);
    }
}
