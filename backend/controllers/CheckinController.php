<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Checkin Controller
|--------------------------------------------------------------------------
|
| Endpoint'ler:
|   POST   /api/checkins      → Yeni check-in
|   GET    /api/checkins       → Kullanıcının check-in'leri
|   DELETE /api/checkins/{id}  → Check-in sil
|
|--------------------------------------------------------------------------
*/

class CheckinController
{
    private WeeklyCheckin $checkinModel;

    public function __construct(PDO $db)
    {
        $this->checkinModel = new WeeklyCheckin($db);
    }

    /** POST /api/checkins */
    public function create(array $payload): void
    {
        $userId = AuthMiddleware::authenticate();

        if (empty($payload['weight_kg'])) {
            ResponseHelper::error('weight_kg alanı zorunludur.', 422);
            return;
        }

        // Eğer bir form fotoğrafı yüklendiyse (base64 string olarak gelebilir veya dosya olarak, base64 gelirse kaydedelim)
        $photoPath = null;
        if (!empty($payload['photo_base64'])) {
            try {
                $imgData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $payload['photo_base64']));
                $uploadDir = __DIR__ . '/../public/uploads/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $fileName = 'checkin_' . $userId . '_' . time() . '.jpg';
                file_put_contents($uploadDir . $fileName, $imgData);
                $photoPath = '/uploads/' . $fileName;
            } catch (Exception $e) {
                // Hata durumunda boş geç
            }
        }

        // AI Geri Bildirimi oluşturma (Kullanıcı koç tipine göre)
        $db = $this->checkinModel->getDbConnection(); // db bağlantısı almak için modelimizi güncelleyeceğiz
        $userStmt = $db->prepare("SELECT koc_tipi FROM kullanicilar WHERE id = :id");
        $userStmt->execute(['id' => $userId]);
        $user = $userStmt->fetch();
        $coachType = strtolower($user['koc_tipi'] ?? 'demir');

        $kilo = $payload['weight_kg'];
        $uyum = $payload['adherence_score'] ?? 50;
        $notlar = $payload['notes'] ?? '';
        $biceps = $payload['biceps_cm'] ?? null;

        // Koç stiline göre mesaj türet
        if ($coachType === 'ipek') {
            $coachName = 'Diyetisyen İpek';
            $ai_feedback = "Harikasın! Bu hafta gösterdiğin %{$uyum} uyum oranı için seni tebrik ederim. Kilon {$kilo} kg olarak kaydedildi.";
            if ($biceps) {
                $ai_feedback .= " Biceps ölçün {$biceps} cm olarak kaydedildi. Kas kütleni korumamız harika. 💪";
            }
            $ai_feedback .= " Kendine nazik davran, harika bir yoldasın! 🌸";
        } elseif ($coachType === 'zen') {
            $coachName = 'Zen Koçu';
            $ai_feedback = "Haftalık dengeni {$kilo} kg ile tamamladın.";
            if ($biceps) {
                $ai_feedback .= " Beden farkındalığın için {$biceps} cm biceps ölçün de eklendi.";
            }
            $ai_feedback .= " %{$uyum} uyum oranı zihninin ve bedeninin uyum içinde çalıştığını gösteriyor. 🧘‍♂️";
        } else {
            $coachName = 'Sert Koç Demir';
            if ($uyum >= 85) {
                $ai_feedback = "Tebrikler, bu hafta disiplinli davrandın (%{$uyum} uyum). {$kilo} kg ile hedefe sadıksın.";
                if ($biceps) {
                    $ai_feedback .= " Biceps ölçün: {$biceps} cm.";
                }
                $ai_feedback .= " Taviz yok, aynı kararlılıkla devam ediyoruz! 🎯";
            } else {
                $ai_feedback = "Uyum oranı %{$uyum} seviyesinde kalmış. Bu disiplinle hedefe ulaşamayız. Kilon {$kilo} kg.";
                if ($biceps) {
                    $ai_feedback .= " Biceps ölçün: {$biceps} cm.";
                }
                $ai_feedback .= " Bahaneleri geride bırakıp haftaya %100 odaklanmanı istiyorum! ⚡";
            }
        }

        if (!empty($notlar)) {
            $ai_feedback .= " Ayrıca notunu okudum: '" . mb_substr($notlar, 0, 80) . "...'";
        }

        $payload['photo_path'] = $photoPath;
        $payload['ai_feedback'] = $ai_feedback;
        $payload['biceps_cm'] = $biceps;

        $checkin = $this->checkinModel->create($userId, $payload);
        ResponseHelper::success(['checkin' => $checkin], 201);
    }

    /** GET /api/checkins */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $checkins = $this->checkinModel->getByUserId($userId);
        ResponseHelper::success(['checkins' => $checkins]);
    }

    /** DELETE /api/checkins/{id} */
    public function delete(int $id): void
    {
        $userId = AuthMiddleware::authenticate();

        if (!$this->checkinModel->delete($id, $userId)) {
            ResponseHelper::error('Check-in bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Check-in silindi.']);
    }
}
