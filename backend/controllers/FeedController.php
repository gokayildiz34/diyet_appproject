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
        $posts = $this->postModel->getAll();

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

        if ($content === '') {
            ResponseHelper::error('İçerik alanı zorunludur.', 422);
            return;
        }

        $post = $this->postModel->create($userId, [
            'content'   => $content,
            'image_url' => $payload['image_url'] ?? null,
            'type'      => $payload['type'] ?? 'text',
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
        ResponseHelper::success(['comment' => $comment], 201);
    }
}
