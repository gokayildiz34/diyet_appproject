<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - WeeklyCheckin Model (Haftalık Check-in)
|--------------------------------------------------------------------------
|
| Tablo: haftalik_checkinler
|
|--------------------------------------------------------------------------
*/

class WeeklyCheckin
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getDbConnection(): PDO
    {
        return $this->db;
    }

    public function create(int $userId, array $data): array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO haftalik_checkinler 
             (kullanici_id, kilo_kg, bel_cm, uyku_saat, enerji_puani, uyum_puani, notlar, checkin_tarihi, mood, photo_path, ai_feedback, biceps_cm)
             VALUES (:uid, :kilo, :bel, :uyku, :enerji, :uyum, :notlar, :tarih, :mood, :photo, :ai_fb, :biceps)"
        );
        $stmt->execute([
            'uid'    => $userId,
            'kilo'   => $data['weight_kg'] ?? 0,
            'bel'    => $data['waist_cm'] ?? null,
            'uyku'   => $data['sleep_hours'] ?? null,
            'enerji' => $data['energy_score'] ?? 5,
            'uyum'   => $data['adherence_score'] ?? 50,
            'notlar' => $data['notes'] ?? null,
            'tarih'  => $data['date'] ?? date('Y-m-d'),
            'mood'   => $data['mood'] ?? null,
            'photo'  => $data['photo_path'] ?? null,
            'ai_fb'  => $data['ai_feedback'] ?? null,
            'biceps' => $data['biceps_cm'] ?? null,
        ]);

        $id = (int) $this->db->lastInsertId();
        return $this->getById($id);
    }

    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, kilo_kg AS weight_kg, bel_cm AS waist_cm,
                    uyku_saat AS sleep_hours, enerji_puani AS energy_score, uyum_puani AS adherence_score,
                    notlar AS notes, checkin_tarihi AS date, olusturulma_tarihi AS created_at,
                    mood, photo_path, ai_feedback, biceps_cm
             FROM haftalik_checkinler WHERE id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getByUserId(int $userId, int $limit = 52): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, kilo_kg AS weight_kg, bel_cm AS waist_cm,
                    uyku_saat AS sleep_hours, enerji_puani AS energy_score, uyum_puani AS adherence_score,
                    notlar AS notes, checkin_tarihi AS date, olusturulma_tarihi AS created_at,
                    mood, photo_path, ai_feedback, biceps_cm
             FROM haftalik_checkinler WHERE kullanici_id = :uid
             ORDER BY checkin_tarihi DESC LIMIT :lim"
        );
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM haftalik_checkinler WHERE id = :id AND kullanici_id = :uid"
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }
}
