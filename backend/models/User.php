<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - User Model (Kullanıcılar Tablosu)
|--------------------------------------------------------------------------
|
| Kullanıcı veritabanı işlemlerini yöneten model sınıfı.
| Tablo: kullanicilar
|
| Görevleri:
|   - E-posta ile kullanıcı arama (findByEmail)
|   - ID ile kullanıcı arama (findById)
|   - Yeni kullanıcı oluşturma (create) — şifre hash'leme dahil
|   - Profil güncelleme (update)
|   - Hassas verileri (sifre_hash) response'dan çıkarma
|
|--------------------------------------------------------------------------
*/

class User
{
    private PDO $db;
    private string $table = 'kullanicilar';

    /**
     * DB sütun → API alan eşlemesi
     */
    private array $columnMap = [
        'id'                    => 'id',
        'ad'                    => 'name',
        'eposta'                => 'email',
        'kullanici_adi'         => 'username',
        'sifre_hash'            => 'password_hash',
        'koc_tipi'              => 'coach_persona',
        'gunluk_kalori_hedefi'  => 'daily_calorie_goal',
        'onboarding_tamamlandi' => 'onboarding_completed',
        'uyelik_tipi'           => 'membership_tier',
        'profil_foto'           => 'profile_photo',
        'bio'                   => 'bio',
        'hedef'                 => 'goal',
        'cinsiyet'              => 'gender',
        'yas'                   => 'age',
        'boy_cm'                => 'height',
        'kilo_kg'               => 'weight',
        'hedef_kilo_kg'         => 'target_weight',
        'aktivite_seviyesi'     => 'activity_level',
        'email_verified_at'     => 'email_verified_at',
        'verification_token'    => 'verification_token',
        'olusturulma_tarihi'    => 'created_at',
        'guncelleme_tarihi'     => 'updated_at',
    ];

    /**
     * API alan → DB sütun eşlemesi (tersi)
     */
    private array $apiToColumn = [
        'name'                 => 'ad',
        'email'                => 'eposta',
        'username'             => 'kullanici_adi',
        'password_hash'        => 'sifre_hash',
        'coach_persona'        => 'koc_tipi',
        'daily_calorie_goal'   => 'gunluk_kalori_hedefi',
        'onboarding_completed' => 'onboarding_tamamlandi',
        'membership_tier'      => 'uyelik_tipi',
        'profile_photo'        => 'profil_foto',
        'bio'                  => 'bio',
        'goal'                 => 'hedef',
        'gender'               => 'cinsiyet',
        'age'                  => 'yas',
        'height'               => 'boy_cm',
        'weight'               => 'kilo_kg',
        'target_weight'        => 'hedef_kilo_kg',
        'activity_level'       => 'aktivite_seviyesi',
        'email_verified_at'    => 'email_verified_at',
        'verification_token'   => 'verification_token',
    ];

    /**
     * Dışarıya dönerken gizlenecek alanlar
     */
    private array $hiddenFields = ['password_hash'];

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * E-posta adresiyle kullanıcı bul
     * Şifre doğrulama için password_hash dahil döner
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE eposta = :eposta LIMIT 1");
        $stmt->execute(['eposta' => $email]);
        $user = $stmt->fetch();

        return $user ? $this->mapToApi($user) : null;
    }

    /**
     * ID ile kullanıcı bul (password_hash hariç)
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            return null;
        }

        return $this->sanitize($this->mapToApi($user));
    }

    /**
     * Yeni kullanıcı oluştur
     *
     * @param array $data ['name', 'email', 'password']
     * @return array Oluşturulan kullanıcı verisi (password_hash hariç)
     */
    public function create(array $data): array
    {
        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);

        $username = $data['username'] ?? '';
        if (empty($username)) {
            $base = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['name']));
            if (empty($base)) $base = 'user';
            $username = $base . '_' . mt_rand(1000, 9999);
        }

        $sql = "INSERT INTO {$this->table} (ad, eposta, kullanici_adi, sifre_hash)
                VALUES (:ad, :eposta, :kullanici_adi, :sifre_hash)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'ad'         => $data['name'],
            'eposta'        => $data['email'],
            'kullanici_adi' => $username,
            'sifre_hash'    => $passwordHash,
        ]);

        $userId = (int) $this->db->lastInsertId();

        return $this->findById($userId);
    }

    /**
     * E-posta adresinin zaten kayıtlı olup olmadığını kontrol et
     */
    public function emailExists(string $email): bool
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE eposta = :eposta");
        $stmt->execute(['eposta' => $email]);

        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Kullanıcı profilini güncelle
     */
    public function setVerificationToken(int $id, string $token): bool
    {
        $stmt = $this->db->prepare('UPDATE ' . $this->table . ' SET verification_token = :token WHERE id = :id');
        return $stmt->execute(['token' => $token, 'id' => $id]);
    }

    public function verifyEmail(int $id): bool
    {
        $stmt = $this->db->prepare('UPDATE ' . $this->table . ' SET email_verified_at = NOW(), verification_token = NULL WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function findByVerificationToken(string $token): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM ' . $this->table . ' WHERE verification_token = :token LIMIT 1');
        $stmt->execute(['token' => $token]);
        $row = $stmt->fetch();
        return $row ? $this->mapToApi($row) : null;
    }

    public function update(int $id, array $data): ?array
    {
        $allowedApiFields = [
            'name', 'username', 'coach_persona', 'daily_calorie_goal', 'onboarding_completed',
            'membership_tier', 'profile_photo', 'bio',
            'goal', 'gender', 'age', 'height', 'weight', 'target_weight', 'activity_level',
        ];
        $setClauses = [];
        $params = ['id' => $id];

        foreach ($data as $apiKey => $value) {
            if (in_array($apiKey, $allowedApiFields, true) && isset($this->apiToColumn[$apiKey])) {
                $dbCol = $this->apiToColumn[$apiKey];
                $setClauses[] = "{$dbCol} = :{$dbCol}";
                $params[$dbCol] = $value;
            }
        }

        if (empty($setClauses)) {
            return $this->findById($id);
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->findById($id);
    }

    /**
     * Kullanıcı adını ID ile getir (yorum/post için)
     */
    public function getNameById(int $id): ?string
    {
        $stmt = $this->db->prepare("SELECT ad FROM {$this->table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ? $result['ad'] : null;
    }

    /**
     * DB sütun isimlerini API isimlerine dönüştür
     */
    private function mapToApi(array $row): array
    {
        $mapped = [];
        foreach ($row as $key => $value) {
            $apiKey = $this->columnMap[$key] ?? $key;
            $mapped[$apiKey] = $value;
        }
        return $mapped;
    }

    /**
     * Hassas alanları çıkar
     */
    private function sanitize(array $user): array
    {
        foreach ($this->hiddenFields as $field) {
            unset($user[$field]);
        }

        // Boolean'a çevir
        if (isset($user['onboarding_completed'])) {
            $user['onboarding_completed'] = (bool) $user['onboarding_completed'];
        }

        return $user;
    }

    /**
     * Kullanıcıyı ID ile getir — sifre_hash dahil (şifre doğrulama için)
     */
    public function getRawById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * Şifre hash'ini güncelle
     */
    public function updatePasswordHash(int $id, string $hash): bool
    {
        $stmt = $this->db->prepare("UPDATE {$this->table} SET sifre_hash = :hash WHERE id = :id");
        $stmt->execute(['hash' => $hash, 'id' => $id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Kullanıcı arama (ad veya e-posta ile)
     * Keşfet sayfası için kullanılır
     */
    public function search(string $query, int $excludeUserId = 0, int $limit = 20): array
    {
        $likeQuery = '%' . $query . '%';
        $sql = "SELECT id, ad AS name, eposta AS email, kullanici_adi AS username, koc_tipi AS coach_persona, profil_foto AS profile_photo
                FROM {$this->table}
                WHERE (ad LIKE :q1 OR kullanici_adi LIKE :q2)";

        if ($excludeUserId > 0) {
            $sql .= " AND id != :exclude";
        }

        $sql .= " ORDER BY ad ASC LIMIT :lim";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':q1', $likeQuery, PDO::PARAM_STR);
        $stmt->bindValue(':q2', $likeQuery, PDO::PARAM_STR);
        if ($excludeUserId > 0) {
            $stmt->bindValue(':exclude', $excludeUserId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
