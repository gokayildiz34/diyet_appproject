<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Post Model (Gönderi, Beğeni, Destek, Yorum)
|--------------------------------------------------------------------------
|
| Feed gönderilerinin CRUD işlemlerini ve etkileşimlerini yönetir.
| Tablolar: gonderiler, begeniler, destekler, yorumlar
|
|--------------------------------------------------------------------------
*/

class Post
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Tüm gönderileri getir (kullanıcı bilgisi, beğeni/destek sayıları ile)
     */
    public function getAll(int $limit = 50, int $offset = 0): array
    {
        $sql = "
            SELECT 
                g.id,
                g.kullanici_id AS user_id,
                k.ad AS user_name,
                g.icerik AS content,
                g.gorsel_url AS image_url,
                g.tur AS type,
                g.olusturulma_tarihi AS created_at,
                (SELECT COUNT(*) FROM begeniler b WHERE b.gonderi_id = g.id) AS like_count,
                (SELECT COUNT(*) FROM destekler d WHERE d.gonderi_id = g.id) AS support_count,
                (SELECT COUNT(*) FROM yorumlar y WHERE y.gonderi_id = g.id) AS comment_count
            FROM gonderiler g
            JOIN kullanicilar k ON k.id = g.kullanici_id
            ORDER BY g.olusturulma_tarihi DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Tek gönderiyi getir
     */
    public function getById(int $id): ?array
    {
        $sql = "
            SELECT 
                g.id,
                g.kullanici_id AS user_id,
                k.ad AS user_name,
                g.icerik AS content,
                g.gorsel_url AS image_url,
                g.tur AS type,
                g.olusturulma_tarihi AS created_at,
                (SELECT COUNT(*) FROM begeniler b WHERE b.gonderi_id = g.id) AS like_count,
                (SELECT COUNT(*) FROM destekler d WHERE d.gonderi_id = g.id) AS support_count,
                (SELECT COUNT(*) FROM yorumlar y WHERE y.gonderi_id = g.id) AS comment_count
            FROM gonderiler g
            JOIN kullanicilar k ON k.id = g.kullanici_id
            WHERE g.id = :id
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $post = $stmt->fetch();

        return $post ?: null;
    }

    /**
     * Yeni gönderi oluştur
     */
    public function create(int $userId, array $data): array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO gonderiler (kullanici_id, icerik, gorsel_url, tur)
             VALUES (:kullanici_id, :icerik, :gorsel_url, :tur)"
        );

        $stmt->execute([
            'kullanici_id' => $userId,
            'icerik'       => $data['content'],
            'gorsel_url'   => $data['image_url'] ?? null,
            'tur'          => $data['type'] ?? 'text',
        ]);

        $postId = (int) $this->db->lastInsertId();
        return $this->getById($postId);
    }

    /**
     * Gönderi sil (sadece sahibi silebilir)
     */
    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM gonderiler WHERE id = :id AND kullanici_id = :kullanici_id"
        );
        $stmt->execute(['id' => $id, 'kullanici_id' => $userId]);

        return $stmt->rowCount() > 0;
    }

    // =============================================
    // BEĞENİ İŞLEMLERİ
    // =============================================

    /**
     * Gönderiyi beğen
     */
    public function like(int $postId, int $userId): bool
    {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO begeniler (gonderi_id, kullanici_id) VALUES (:gonderi_id, :kullanici_id)"
            );
            $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);
            return true;
        } catch (PDOException $e) {
            // Zaten beğenilmiş (UNIQUE constraint)
            return false;
        }
    }

    /**
     * Beğeniyi geri al
     */
    public function unlike(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM begeniler WHERE gonderi_id = :gonderi_id AND kullanici_id = :kullanici_id"
        );
        $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Kullanıcı bu gönderiyi beğenmiş mi?
     */
    public function isLikedBy(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM begeniler WHERE gonderi_id = :gonderi_id AND kullanici_id = :kullanici_id"
        );
        $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    // =============================================
    // DESTEK İŞLEMLERİ
    // =============================================

    /**
     * Gönderiyi destekle
     */
    public function support(int $postId, int $userId): bool
    {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO destekler (gonderi_id, kullanici_id) VALUES (:gonderi_id, :kullanici_id)"
            );
            $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Desteği geri al
     */
    public function unsupport(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM destekler WHERE gonderi_id = :gonderi_id AND kullanici_id = :kullanici_id"
        );
        $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Kullanıcı bu gönderiyi desteklemiş mi?
     */
    public function isSupportedBy(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM destekler WHERE gonderi_id = :gonderi_id AND kullanici_id = :kullanici_id"
        );
        $stmt->execute(['gonderi_id' => $postId, 'kullanici_id' => $userId]);

        return (int) $stmt->fetchColumn() > 0;
    }

    // =============================================
    // YORUM İŞLEMLERİ
    // =============================================

    /**
     * Gönderinin yorumlarını getir
     */
    public function getComments(int $postId): array
    {
        $sql = "
            SELECT 
                y.id,
                y.kullanici_id AS user_id,
                k.ad AS user_name,
                y.icerik AS content,
                y.olusturulma_tarihi AS created_at
            FROM yorumlar y
            JOIN kullanicilar k ON k.id = y.kullanici_id
            WHERE y.gonderi_id = :gonderi_id
            ORDER BY y.olusturulma_tarihi ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['gonderi_id' => $postId]);

        return $stmt->fetchAll();
    }

    /**
     * Yorum ekle
     */
    public function addComment(int $postId, int $userId, string $content): array
    {
        $stmt = $this->db->prepare(
            "INSERT INTO yorumlar (gonderi_id, kullanici_id, icerik)
             VALUES (:gonderi_id, :kullanici_id, :icerik)"
        );

        $stmt->execute([
            'gonderi_id'   => $postId,
            'kullanici_id' => $userId,
            'icerik'       => $content,
        ]);

        $commentId = (int) $this->db->lastInsertId();

        // Eklenen yorumu geri dön
        $stmt = $this->db->prepare(
            "SELECT y.id, y.kullanici_id AS user_id, k.ad AS user_name, 
                    y.icerik AS content, y.olusturulma_tarihi AS created_at
             FROM yorumlar y
             JOIN kullanicilar k ON k.id = y.kullanici_id
             WHERE y.id = :id"
        );
        $stmt->execute(['id' => $commentId]);

        return $stmt->fetch();
    }

    /**
     * Gönderi bilgilerini kullanıcının like/support durumu ile zenginleştir
     */
    public function enrichWithUserStatus(array $post, int $userId): array
    {
        $post['is_liked']     = $this->isLikedBy((int) $post['id'], $userId);
        $post['is_supported'] = $this->isSupportedBy((int) $post['id'], $userId);
        return $post;
    }
}
