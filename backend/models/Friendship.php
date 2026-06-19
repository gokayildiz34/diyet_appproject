<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Friendship Model (Arkadaşlıklar)
|--------------------------------------------------------------------------
|
| Tablo: arkadasliklar
| Durumlar: beklemede, kabul_edildi, reddedildi
|
|--------------------------------------------------------------------------
*/

class Friendship
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function sendRequest(int $requesterId, int $addresseeId): ?array
    {
        if ($requesterId === $addresseeId) return null;

        // Zaten istek var mı kontrol et
        $stmt = $this->db->prepare(
            "SELECT id, durum FROM arkadasliklar 
             WHERE (isteyen_id = :r AND alici_id = :a) OR (isteyen_id = :a2 AND alici_id = :r2) LIMIT 1"
        );
        $stmt->execute(['r' => $requesterId, 'a' => $addresseeId, 'a2' => $addresseeId, 'r2' => $requesterId]);
        $existing = $stmt->fetch();

        if ($existing) return null; // Zaten bir ilişki var

        $stmt = $this->db->prepare(
            "INSERT INTO arkadasliklar (isteyen_id, alici_id, durum) VALUES (:r, :a, 'beklemede')"
        );
        $stmt->execute(['r' => $requesterId, 'a' => $addresseeId]);

        $id = (int) $this->db->lastInsertId();
        return $this->getById($id);
    }

    public function acceptRequest(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE arkadasliklar SET durum = 'kabul_edildi' 
             WHERE id = :id AND alici_id = :uid AND durum = 'beklemede'"
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }

    public function declineRequest(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE arkadasliklar SET durum = 'reddedildi' 
             WHERE id = :id AND alici_id = :uid AND durum = 'beklemede'"
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }

    public function getFriends(int $userId): array
    {
        $sql = "
            SELECT k.id, k.ad AS name, k.eposta AS email
            FROM arkadasliklar a
            JOIN kullanicilar k ON k.id = CASE 
                WHEN a.isteyen_id = :uid1 THEN a.alici_id 
                ELSE a.isteyen_id END
            WHERE (a.isteyen_id = :uid2 OR a.alici_id = :uid3) AND a.durum = 'kabul_edildi'
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uid1' => $userId, 'uid2' => $userId, 'uid3' => $userId]);
        return $stmt->fetchAll();
    }

    public function getPendingRequests(int $userId): array
    {
        $sql = "
            SELECT a.id AS request_id, k.id, k.ad AS name, k.eposta AS email, a.olusturulma_tarihi AS created_at
            FROM arkadasliklar a
            JOIN kullanicilar k ON k.id = a.isteyen_id
            WHERE a.alici_id = :uid AND a.durum = 'beklemede'
            ORDER BY a.olusturulma_tarihi DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll();
    }

    public function getSentRequests(int $userId): array
    {
        $sql = "
            SELECT a.id AS request_id, k.id, k.ad AS name, k.eposta AS email, a.olusturulma_tarihi AS created_at
            FROM arkadasliklar a
            JOIN kullanicilar k ON k.id = a.alici_id
            WHERE a.isteyen_id = :uid AND a.durum = 'beklemede'
            ORDER BY a.olusturulma_tarihi DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetchAll();
    }

    public function removeFriend(int $userId, int $friendId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM arkadasliklar 
             WHERE ((isteyen_id = :u1 AND alici_id = :f1) OR (isteyen_id = :f2 AND alici_id = :u2))
             AND durum = 'kabul_edildi'"
        );
        $stmt->execute(['u1' => $userId, 'f1' => $friendId, 'f2' => $friendId, 'u2' => $userId]);
        return $stmt->rowCount() > 0;
    }

    private function getById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, isteyen_id AS requester_id, alici_id AS addressee_id, 
                    durum AS status, olusturulma_tarihi AS created_at
             FROM arkadasliklar WHERE id = :id LIMIT 1"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
