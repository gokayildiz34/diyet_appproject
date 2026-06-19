<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - DietPlan Model (Diyet Planları)
|--------------------------------------------------------------------------
|
| AI koçun oluşturduğu diyet planlarını ve öğünlerini yönetir.
| Tablolar: diyet_planlari, diyet_plan_ogunleri
|
|--------------------------------------------------------------------------
*/

class DietPlan
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(int $userId, array $data): array
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO diyet_planlari (kullanici_id, koc_tipi, toplam_kalori, plan_tarihi, koc_mesaji)
                 VALUES (:kullanici_id, :koc_tipi, :toplam_kalori, :plan_tarihi, :koc_mesaji)"
            );
            $stmt->execute([
                'kullanici_id'  => $userId,
                'koc_tipi'      => $data['coach_persona'] ?? 'demir',
                'toplam_kalori' => $data['total_calories'] ?? 2000,
                'plan_tarihi'   => $data['plan_date'] ?? date('Y-m-d'),
                'koc_mesaji'    => $data['coach_message'] ?? null,
            ]);
            $planId = (int) $this->db->lastInsertId();

            if (!empty($data['meals']) && is_array($data['meals'])) {
                $mealStmt = $this->db->prepare(
                    "INSERT INTO diyet_plan_ogunleri (plan_id, ogun_adi, hedef_kalori, menu, sira)
                     VALUES (:plan_id, :ogun_adi, :hedef_kalori, :menu, :sira)"
                );
                foreach ($data['meals'] as $i => $meal) {
                    $mealStmt->execute([
                        'plan_id'      => $planId,
                        'ogun_adi'     => $meal['name'] ?? ('Öğün ' . ($i + 1)),
                        'hedef_kalori' => $meal['targetCalories'] ?? 0,
                        'menu'         => $meal['menu'] ?? '',
                        'sira'         => $i,
                    ]);
                }
            }
            $this->db->commit();
            return $this->getById($planId);
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, koc_tipi AS coach_persona,
                    toplam_kalori AS total_calories, plan_tarihi AS plan_date,
                    koc_mesaji AS coach_message, olusturulma_tarihi AS created_at
             FROM diyet_planlari WHERE id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $plan = $stmt->fetch();
        if (!$plan) return null;
        $plan['meals'] = $this->getMeals($id);
        return $plan;
    }

    public function getByUserId(int $userId, int $limit = 20): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, koc_tipi AS coach_persona,
                    toplam_kalori AS total_calories, plan_tarihi AS plan_date,
                    koc_mesaji AS coach_message, olusturulma_tarihi AS created_at
             FROM diyet_planlari WHERE kullanici_id = :uid ORDER BY plan_tarihi DESC LIMIT :lim"
        );
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $plans = $stmt->fetchAll();
        foreach ($plans as &$p) { $p['meals'] = $this->getMeals((int)$p['id']); }
        return $plans;
    }

    public function getLatest(int $userId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id FROM diyet_planlari WHERE kullanici_id = :uid ORDER BY plan_tarihi DESC, id DESC LIMIT 1"
        );
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        return $row ? $this->getById((int)$row['id']) : null;
    }

    private function getMeals(int $planId): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, ogun_adi AS name, hedef_kalori AS targetCalories, menu, sira AS sort_order
             FROM diyet_plan_ogunleri WHERE plan_id = :pid ORDER BY sira ASC"
        );
        $stmt->execute(['pid' => $planId]);
        return $stmt->fetchAll();
    }
}
