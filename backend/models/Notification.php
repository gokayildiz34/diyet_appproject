<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Notification Model (Bildirimler)
|--------------------------------------------------------------------------
|
| Tablo: bildirimler
|
|--------------------------------------------------------------------------
*/

class Notification
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(int $userId, array $data): array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO bildirimler (kullanici_id, tur, baslik, mesaj, veri)
             VALUES (:uid, :tur, :baslik, :mesaj, :veri)"
        );
        $stmt->execute([
            'uid'    => $userId,
            'tur'    => $data['type'] ?? 'genel',
            'baslik' => $data['title'],
            'mesaj'  => $data['message'],
            'veri'   => isset($data['data']) ? json_encode($data['data']) : null,
        ]);
        $id = (int) $this->db->lastInsertId();
        return $this->getById($id);
    }

    public function getById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, tur AS type, baslik AS title,
                    mesaj AS message, veri AS data, okundu AS is_read, olusturulma_tarihi AS created_at
             FROM bildirimler WHERE id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $row['is_read'] = (bool) $row['is_read'];
        if ($row['data']) $row['data'] = json_decode($row['data'], true);
        return $row;
    }

    public function getByUserId(int $userId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            "SELECT id, kullanici_id AS user_id, tur AS type, baslik AS title,
                    mesaj AS message, veri AS data, okundu AS is_read, olusturulma_tarihi AS created_at
             FROM bildirimler WHERE kullanici_id = :uid
             ORDER BY olusturulma_tarihi DESC LIMIT :lim"
        );
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['is_read'] = (bool) $r['is_read'];
            if ($r['data']) $r['data'] = json_decode($r['data'], true);
        }
        return $rows;
    }

    public function markAsRead(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE bildirimler SET okundu = 1 WHERE id = :id AND kullanici_id = :uid"
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }

    public function markAllAsRead(int $userId): int
    {
        $stmt = $this->db->prepare(
            "UPDATE bildirimler SET okundu = 1 WHERE kullanici_id = :uid AND okundu = 0"
        );
        $stmt->execute(['uid' => $userId]);
        return $stmt->rowCount();
    }
}
