<?php

/**
 * FitPlate - Notification Controller
 * OneSignal REST API üzerinden push bildirim gönderme
 * + DB üzerinden bildirim CRUD işlemleri
 */

class NotificationController
{
    private string $appId;
    private string $restApiKey;
    private string $apiUrl = 'https://onesignal.com/api/v1/notifications';
    private ?PDO $db;
    private ?Notification $notifModel;

    public function __construct(?PDO $db = null)
    {
        $this->appId = getenv('ONESIGNAL_APP_ID') ?: '';
        $this->restApiKey = getenv('ONESIGNAL_REST_API_KEY') ?: '';
        $this->db = $db;
        $this->notifModel = $db ? new Notification($db) : null;
    }

    /**
     * GET /api/notifications
     * Kullanıcının bildirimlerini listele
     */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $notifications = $this->notifModel->getByUserId($userId);
        ResponseHelper::success(['notifications' => $notifications]);
    }

    /**
     * PUT /api/notifications/{id}/read
     * Tek bildirimi okundu yap
     */
    public function markAsRead(int $id): void
    {
        $userId = AuthMiddleware::authenticate();
        $this->notifModel->markAsRead($id, $userId);
        ResponseHelper::success(['message' => 'Bildirim okundu olarak işaretlendi.']);
    }

    /**
     * PUT /api/notifications/read-all
     * Tüm bildirimleri okundu yap
     */
    public function markAllAsRead(): void
    {
        $userId = AuthMiddleware::authenticate();
        $count = $this->notifModel->markAllAsRead($userId);
        ResponseHelper::success(['message' => "$count bildirim okundu olarak işaretlendi.", 'count' => $count]);
    }

    /**
     * DELETE /api/notifications/{id}
     * Bildirim sil
     */
    public function deleteNotification(int $id): void
    {
        $userId = AuthMiddleware::authenticate();
        if (!$this->notifModel) {
            ResponseHelper::error('DB bağlantısı yok.', 500);
            return;
        }

        $stmt = $this->db->prepare("DELETE FROM bildirimler WHERE id = :id AND kullanici_id = :uid");
        $stmt->execute(['id' => $id, 'uid' => $userId]);

        if ($stmt->rowCount() > 0) {
            ResponseHelper::success(['message' => 'Bildirim silindi.']);
        } else {
            ResponseHelper::error('Bildirim bulunamadı.', 404);
        }
    }


    /**
     * Belirli bir kullanıcıya push bildirim gönderir
     * POST /api/notifications/send
     *
     * Body:
     *   external_id (string) - Hedef kullanıcının ID'si
     *   title       (string) - Bildirim başlığı
     *   message     (string) - Bildirim mesajı
     *   url         (string) - Opsiyonel, tıklanınca açılacak URL
     *   data        (object) - Opsiyonel, ek veri
     */
    public function sendToUser(array $body): void
    {
        if (empty($this->appId) || empty($this->restApiKey)) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'OneSignal API bilgileri yapılandırılmamış'
            ]);
            return;
        }

        $externalId = $body['external_id'] ?? '';
        $title = $body['title'] ?? '';
        $message = $body['message'] ?? '';

        if (empty($externalId) || empty($title) || empty($message)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'external_id, title ve message alanları zorunludur'
            ]);
            return;
        }

        $payload = [
            'app_id' => $this->appId,
            'include_aliases' => [
                'external_id' => [$externalId]
            ],
            'target_channel' => 'push',
            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
        ];

        if (!empty($body['url'])) {
            $payload['url'] = $body['url'];
        }

        if (!empty($body['data']) && is_array($body['data'])) {
            $payload['data'] = $body['data'];
        }

        $result = $this->sendRequest($payload);
        echo json_encode($result);
    }

    /**
     * Dahili kullanım için Push Bildirim Gönderir (Echo yapmaz)
     * @param string $externalId Kullanıcı ID'si
     * @param string $title Başlık
     * @param string $message Mesaj
     * @param array $data Ek veri
     * @return bool Başarılı ise true
     */
    public function sendPushToUserInternal(string $externalId, string $title, string $message, array $data = []): bool
    {
        if (empty($this->appId) || empty($this->restApiKey) || empty($externalId)) {
            return false;
        }

        $payload = [
            'app_id' => $this->appId,
            'include_aliases' => [
                'external_id' => [(string)$externalId]
            ],
            'target_channel' => 'push',
            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
        ];

        if (!empty($data)) {
            $payload['data'] = $data;
        }

        $result = $this->sendRequest($payload);
        return $result['status'] === 'success';
    }

    /**
     * Tüm abonelere toplu bildirim gönderir
     * POST /api/notifications/broadcast
     *
     * Body:
     *   title   (string) - Bildirim başlığı
     *   message (string) - Bildirim mesajı
     *   url     (string) - Opsiyonel
     *   data    (object) - Opsiyonel
     */
    public function broadcast(array $body): void
    {
        if (empty($this->appId) || empty($this->restApiKey)) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'OneSignal API bilgileri yapılandırılmamış'
            ]);
            return;
        }

        $title = $body['title'] ?? '';
        $message = $body['message'] ?? '';

        if (empty($title) || empty($message)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'title ve message alanları zorunludur'
            ]);
            return;
        }

        $payload = [
            'app_id' => $this->appId,
            'included_segments' => ['Total Subscriptions'],
            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
        ];

        if (!empty($body['url'])) {
            $payload['url'] = $body['url'];
        }

        if (!empty($body['data']) && is_array($body['data'])) {
            $payload['data'] = $body['data'];
        }

        $result = $this->sendRequest($payload);
        echo json_encode($result);
    }

    /**
     * OneSignal REST API'ye cURL isteği gönderir
     */
    private function sendRequest(array $payload): array
    {
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json; charset=utf-8',
                'Authorization: Basic ' . $this->restApiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_SSL_VERIFYPEER => false, // Localhost SSL hatası için
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            http_response_code(500);
            return [
                'status' => 'error',
                'message' => 'OneSignal API bağlantı hatası: ' . $curlError
            ];
        }

        $decoded = json_decode($response, true);

        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'status' => 'success',
                'message' => 'Bildirim başarıyla gönderildi',
                'onesignal_response' => $decoded
            ];
        }

        http_response_code($httpCode);
        return [
            'status' => 'error',
            'message' => 'OneSignal API hatası',
            'onesignal_response' => $decoded
        ];
    }
}
