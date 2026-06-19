<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Auth Controller
|--------------------------------------------------------------------------
|
| Kullanıcı kimlik doğrulama ve profil işlemlerini yönetir.
|
| Endpoint'ler:
|   POST /api/auth/register         → Yeni kullanıcı kaydı
|   POST /api/auth/login            → Kullanıcı girişi
|   GET  /api/auth/me               → Mevcut kullanıcı bilgisi (JWT gerekli)
|   PUT  /api/auth/profile          → Profil güncelleme (JWT gerekli)
|   POST /api/auth/forgot-password  → Şifre sıfırlama e-postası gönder
|   POST /api/auth/reset-password   → Token ile şifre sıfırla
|
|--------------------------------------------------------------------------
*/

class AuthController
{
    private User $userModel;
    private string $jwtSecret;
    private PDO $db;
    private ResendMailer $mailer;

    public function __construct(PDO $db)
    {
        $this->db        = $db;
        $this->userModel = new User($db);
        $this->jwtSecret = getenv('JWT_SECRET') ?: 'default-secret-change-me';
        $this->mailer    = new ResendMailer();
    }

    /**
     * POST /api/auth/register
     */
    public function register(array $payload): void
    {
        $name     = trim((string) ($payload['name'] ?? ''));
        $email    = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        $errors = [];
        if ($name === '') $errors[] = 'Ad alanı zorunludur.';
        elseif (strlen($name) > 100) $errors[] = 'Ad en fazla 100 karakter olabilir.';

        if ($email === '') $errors[] = 'E-posta alanı zorunludur.';
        elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Geçerli bir e-posta adresi girin.';

        if ($password === '') $errors[] = 'Şifre alanı zorunludur.';
        elseif (strlen($password) < 6) $errors[] = 'Şifre en az 6 karakter olmalıdır.';

        if (!empty($errors)) {
            ResponseHelper::validationError($errors);
            return;
        }

        if ($this->userModel->emailExists($email)) {
            ResponseHelper::error('Bu e-posta adresi zaten kayıtlı.', 409);
            return;
        }

        $user = $this->userModel->create([
            'name'     => $name,
            'email'    => $email,
            'password' => $password,
        ]);

        $token = JWTHelper::encode(['user_id' => $user['id']], $this->jwtSecret);

        // Hoş geldiniz maili gönder (arka planda, hata olsa bile kayıt başarılı)
        try {
            $this->mailer->sendWelcome($email, $name);
        } catch (\Throwable $e) {
            // Mail hatası kayıt işlemini engellemesin
        }

        ResponseHelper::success(['user' => $user, 'token' => $token], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(array $payload): void
    {
        $email    = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($email === '' || $password === '') {
            ResponseHelper::error('E-posta ve şifre alanları zorunludur.', 422);
            return;
        }

        $user = $this->userModel->findByEmail($email);

        if ($user === null || !password_verify($password, $user['password_hash'])) {
            ResponseHelper::error('E-posta veya şifre hatalı.', 401);
            return;
        }

        unset($user['password_hash']);
        $user['onboarding_completed'] = (bool) $user['onboarding_completed'];
        $user['membership_tier'] = $user['membership_tier'] ?? 'free';

        $token = JWTHelper::encode(['user_id' => $user['id']], $this->jwtSecret);

        ResponseHelper::success(['user' => $user, 'token' => $token]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(): void
    {
        $userId = AuthMiddleware::authenticate();
        $user = $this->userModel->findById($userId);

        if ($user === null) {
            ResponseHelper::error('Kullanıcı bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['user' => $user]);
    }

    /**
     * PUT /api/auth/profile
     */
    public function updateProfile(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();
        $user = $this->userModel->update($userId, $payload);

        if ($user === null) {
            ResponseHelper::error('Kullanıcı bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['user' => $user]);
    }

    /**
     * PUT /api/auth/password
     */
    public function changePassword(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();

        $currentPassword = (string) ($payload['current_password'] ?? '');
        $newPassword = (string) ($payload['new_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '') {
            ResponseHelper::error('Mevcut şifre ve yeni şifre alanları zorunludur.', 422);
            return;
        }

        if (strlen($newPassword) < 6) {
            ResponseHelper::error('Yeni şifre en az 6 karakter olmalıdır.', 422);
            return;
        }

        // Kullanıcıyı sifre_hash dahil getir (doğrulama için)
        $stmt = $this->userModel->getRawById($userId);

        if ($stmt === null || !password_verify($currentPassword, $stmt['sifre_hash'])) {
            ResponseHelper::error('Mevcut şifre hatalı.', 401);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->userModel->updatePasswordHash($userId, $newHash);

        ResponseHelper::success(['message' => 'Şifre başarıyla değiştirildi.']);
    }

    /**
     * POST /api/auth/forgot-password
     * Şifre sıfırlama e-postası gönderir.
     */
    public function forgotPassword(array $payload): void
    {
        $email = trim((string) ($payload['email'] ?? ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            ResponseHelper::error('Geçerli bir e-posta adresi girin.', 422);
            return;
        }

        $user = $this->userModel->findByEmail($email);

        // Güvenlik: kullanıcı yoksa bile başarılı mesaj dön (e-posta enumeration önleme)
        if ($user === null) {
            ResponseHelper::success(['message' => 'Şifre sıfırlama linki e-posta adresinize gönderildi.']);
            return;
        }

        // Eski token'ları temizle
        $stmt = $this->db->prepare('DELETE FROM password_reset_tokens WHERE email = ?');
        $stmt->execute([$email]);

        // Yeni token oluştur
        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 saat

        $stmt = $this->db->prepare(
            'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$email, $token, $expiresAt]);

        $frontendUrl = getenv('FRONTEND_BASE_URL') ?: 'http://localhost:5173';
        $resetLink   = $frontendUrl . '/reset-password?token=' . $token;

        try {
            $this->mailer->sendPasswordReset($email, $user['name'], $resetLink);
        } catch (\Throwable $e) {
            // Mail servisi çalışmıyor olsa bile token oluşturuldu
        }

        ResponseHelper::success(['message' => 'Şifre sıfırlama linki e-posta adresinize gönderildi.']);
    }

    /**
     * POST /api/auth/reset-password
     * Token ile şifreyi sıfırlar.
     */
    public function resetPassword(array $payload): void
    {
        $token       = trim((string) ($payload['token'] ?? ''));
        $newPassword = (string) ($payload['password'] ?? '');

        if ($token === '' || strlen($newPassword) < 6) {
            ResponseHelper::error('Geçersiz istek. Şifre en az 6 karakter olmalıdır.', 422);
            return;
        }

        $stmt = $this->db->prepare(
            'SELECT email, expires_at FROM password_reset_tokens WHERE token = ? LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();

        if (!$row) {
            ResponseHelper::error('Geçersiz veya kullanılmış sıfırlama linki.', 404);
            return;
        }

        if (new \DateTime() > new \DateTime($row['expires_at'])) {
            ResponseHelper::error('Sıfırlama linki süresi dolmuş. Lütfen tekrar talep edin.', 410);
            return;
        }

        $user = $this->userModel->findByEmail($row['email']);
        if (!$user) {
            ResponseHelper::error('Kullanıcı bulunamadı.', 404);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->userModel->updatePasswordHash($user['id'], $newHash);

        // Kullanılan token'ı sil
        $stmt = $this->db->prepare('DELETE FROM password_reset_tokens WHERE token = ?');
        $stmt->execute([$token]);

        ResponseHelper::success(['message' => 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.']);
    }
}
