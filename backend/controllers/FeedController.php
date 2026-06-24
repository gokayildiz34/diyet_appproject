<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Feed Controller
|--------------------------------------------------------------------------
|
| Feed gönderileri ve etkileşimleri (beğeni, destek, yorum).
|
| Endpoint'ler:
|   GET    /api/feed              → Tüm postları getir
|   POST   /api/feed              → Yeni post oluştur
|   DELETE /api/feed/{id}         → Post sil
|   POST   /api/feed/{id}/like    → Beğen
|   DELETE /api/feed/{id}/like    → Beğeniyi geri al
|   POST   /api/feed/{id}/support → Destekle
|   DELETE /api/feed/{id}/support → Desteği geri al
|   GET    /api/feed/{id}/comments  → Yorumları getir
|   POST   /api/feed/{id}/comments  → Yorum ekle
|
|--------------------------------------------------------------------------
*/

class FeedController
{
    private Post $postModel;

    public function __construct(PDO $db)
    {
        $this->postModel = new Post($db);
    }

    /** GET /api/feed */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $posts = $this->postModel->getAll(50, 0, $userId);

        // Her post için kullanıcının like/support durumunu ekle
        foreach ($posts as &$post) {
            $post = $this->postModel->enrichWithUserStatus($post, $userId);
        }

        ResponseHelper::success(['posts' => $posts]);
    }

    /** POST /api/feed */
    public function create(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();
        $content = trim((string) ($payload['content'] ?? ''));

        if ($content === '' && empty($payload['photo_base64'])) {
            ResponseHelper::error('İçerik veya fotoğraf eklemelisiniz.', 422);
            return;
        }

        $imageUrl = $payload['image_url'] ?? null;
        if (!empty($payload['photo_base64'])) {
            try {
                $imgData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $payload['photo_base64']));
                $uploadDir = __DIR__ . '/../public/uploads/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $fileName = 'post_' . $userId . '_' . time() . '.jpg';
                file_put_contents($uploadDir . $fileName, $imgData);
                $imageUrl = '/uploads/' . $fileName;
            } catch (Exception $e) {
                // Hata durumunda yoksay
            }
        }

        $post = $this->postModel->create($userId, [
            'content'    => $content,
            'image_url'  => $imageUrl,
            'type'       => $payload['type'] ?? 'text',
            'visibility' => $payload['visibility'] ?? 'public',
        ]);

        $post = $this->postModel->enrichWithUserStatus($post, $userId);
        ResponseHelper::success(['post' => $post], 201);
    }

    /** DELETE /api/feed/{id} */
    public function delete(int $postId): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->postModel->delete($postId, $userId)) {
            ResponseHelper::error('Gönderi bulunamadı veya silme yetkiniz yok.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Gönderi silindi.']);
    }

    /** POST /api/feed/{id}/like */
    public function like(int $postId): void
    {
        $userId = AuthMiddleware::authenticate();
        $this->postModel->like($postId, $userId);

        // Bildirim Gönder (Beğeni)
        $post = $this->postModel->getById($postId);
        if ($post && $post['user_id'] != $userId) {
            require_once __DIR__ . '/NotificationController.php';
            $notifController = new NotificationController($this->db);
            $notifController->sendPushToUserInternal(
                (string)$post['user_id'],
                "Yeni Beğeni!",
                "Birisi gönderini beğendi.",
                ['post_id' => $postId]
            );
        }

        ResponseHelper::success(['post_id' => $postId, 'liked' => true]);
    }

    /** DELETE /api/feed/{id}/like */
    public function unlike(int $postId): void
    {
        $userId = AuthMiddleware::authenticate();
        $this->postModel->unlike($postId, $userId);
        ResponseHelper::success(['post_id' => $postId, 'liked' => false]);
    }

    /** POST /api/feed/{id}/support */
    public function support(int $postId): void
    {
        $userId = AuthMiddleware::authenticate();
        $this->postModel->support($postId, $userId);
        ResponseHelper::success(['post_id' => $postId, 'supported' => true]);
    }

    /** DELETE /api/feed/{id}/support */
    public function unsupport(int $postId): void
    {
        $userId = AuthMiddleware::authenticate();
        $this->postModel->unsupport($postId, $userId);
        ResponseHelper::success(['post_id' => $postId, 'supported' => false]);
    }

    /** GET /api/feed/{id}/comments */
    public function getComments(int $postId): void
    {
        AuthMiddleware::authenticate();
        $comments = $this->postModel->getComments($postId);
        ResponseHelper::success(['comments' => $comments]);
    }

    /** POST /api/feed/{id}/comments */
    public function addComment(int $postId, array $payload): void
    {
        $userId = AuthMiddleware::authenticate();
        $content = trim((string) ($payload['content'] ?? ''));

        if ($content === '') {
            ResponseHelper::error('Yorum içeriği zorunludur.', 422);
            return;
        }

        $comment = $this->postModel->addComment($postId, $userId, $content);

        // Bildirim Gönder (Yorum)
        $post = $this->postModel->getById($postId);
        if ($post && $post['user_id'] != $userId) {
            require_once __DIR__ . '/NotificationController.php';
            $notifController = new NotificationController($this->db);
            $notifController->sendPushToUserInternal(
                (string)$post['user_id'],
                "Yeni Yorum!",
                "Gönderine yeni bir yorum yapıldı: " . mb_substr($content, 0, 30) . "...",
                ['post_id' => $postId]
            );
        }

        ResponseHelper::success(['comment' => $comment], 201);
    }
}
