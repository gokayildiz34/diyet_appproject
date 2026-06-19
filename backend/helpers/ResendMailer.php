<?php

/*
|--------------------------------------------------------------------------
| ResendMailer - E-posta Gönderim Servisi
|--------------------------------------------------------------------------
| Resend API kullanarak HTML e-posta gönderir.
|--------------------------------------------------------------------------
*/

class ResendMailer
{
    private string $apiKey;
    private string $from;

    public function __construct()
    {
        $this->apiKey = getenv('RESEND_API_KEY') ?: '';
        $this->from   = getenv('MAIL_FROM') ?: 'onboarding@resend.dev';
    }

    public function send(string $to, string $subject, string $html): bool
    {
        if ($this->apiKey === '') return false;

        $payload = json_encode([
            'from'    => 'FitPlate <' . $this->from . '>',
            'to'      => [$to],
            'subject' => $subject,
            'html'    => $html,
        ]);

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT        => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200 || $httpCode === 201;
    }

    /**
     * Şifre sıfırlama maili
     */
    public function sendPasswordReset(string $to, string $name, string $resetLink): bool
    {
        $subject = 'FitPlate - Şifre Sıfırlama';
        $html = $this->buildTemplate(
            'Şifreni Sıfırla',
            "Merhaba <strong>$name</strong>,<br><br>
            Şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak şifrenizi sıfırlayabilirsiniz.<br><br>
            Bu link <strong>1 saat</strong> geçerlidir. Talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.",
            $resetLink,
            'Şifremi Sıfırla'
        );

        return $this->send($to, $subject, $html);
    }

    /**
     * Hoş geldiniz / kayıt onay maili
     */
    public function sendWelcome(string $to, string $name): bool
    {
        $subject = 'FitPlate\'e Hoş Geldiniz! 🎉';
        $frontendUrl = getenv('FRONTEND_BASE_URL') ?: 'http://localhost:5173';
        $html = $this->buildTemplate(
            "Hoş Geldiniz, $name! 🎉",
            "Hesabınız başarıyla oluşturuldu. Şimdi AI koçunuzu seçebilir, kalori takibinize başlayabilir ve topluluğa katılabilirsiniz.<br><br>
            Sağlıklı bir yaşam yolculuğunda yanınızdayız!",
            $frontendUrl . '/feed',
            'Uygulamaya Git'
        );

        return $this->send($to, $subject, $html);
    }

    /**
     * Güzel HTML mail şablonu
     */
    private function buildTemplate(string $title, string $body, string $btnLink, string $btnText): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$title</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🥗 FitPlate</div>
              <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Akıllı Beslenme Platformu</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 36px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1a2e;">$title</h2>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#555;">$body</p>
              <a href="$btnLink"
                style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;text-decoration:none;
                       font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;">
                $btnText →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">
                Bu e-postayı FitPlate hesabınız nedeniyle aldınız.<br>
                © 2025 FitPlate — Akıllı Beslenme Platformu
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
