<?php

class PaymentController
{
    private array $plans;
    private ?PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db;
        $this->plans = [
            'bronze' => [
                'key' => 'bronze',
                'name' => 'Bronze',
                'amount' => 14900,
                'currency' => 'try',
                'interval' => 'month',
                'features' => [
                    'Temel AI koç önerileri',
                    'Haftalık özet raporu',
                    'Topluluk akışı erişimi',
                ],
            ],
            'gold' => [
                'key' => 'gold',
                'name' => 'Gold',
                'amount' => 29900,
                'currency' => 'try',
                'interval' => 'month',
                'features' => [
                    'Gelişmiş AI koç yorumları',
                    'Günlük kişiselleştirilmiş diyet planı',
                    'Öncelikli destek',
                ],
            ],
            'diamond' => [
                'key' => 'diamond',
                'name' => 'Diamond',
                'amount' => 49900,
                'currency' => 'try',
                'interval' => 'month',
                'features' => [
                    'Sınırsız fotoğraf analizi',
                    'Canlı koç öneri simülasyonu',
                    'Özel premium topluluk alanı',
                ],
            ],
        ];
    }

    public function getPlans(): void
    {
        ResponseHelper::success([
            'plans' => array_values($this->plans),
        ]);
    }

    public function createCheckoutSession(array $payload): void
    {
        $planKey = strtolower(trim((string)($payload['plan'] ?? '')));

        if (!isset($this->plans[$planKey])) {
            ResponseHelper::error('Geçersiz plan seçimi.', 422);
            return;
        }

        $stripeSecretKey = getenv('STRIPE_SECRET_KEY') ?: '';
        if ($stripeSecretKey === '') {
            ResponseHelper::error('Stripe ayarları eksik. STRIPE_SECRET_KEY tanımlayın.', 500);
            return;
        }

        $frontendBaseUrl = rtrim(getenv('FRONTEND_BASE_URL') ?: 'http://localhost:5173', '/');
        $plan = $this->plans[$planKey];

        $successUrl = $payload['successUrl'] ?? ($frontendBaseUrl . '/membership?status=success&plan=' . $planKey);
        $cancelUrl = $payload['cancelUrl'] ?? ($frontendBaseUrl . '/membership?status=cancel');

        $postData = [
            'mode' => 'subscription',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'payment_method_types[0]' => 'card',
            'line_items[0][price_data][currency]' => $plan['currency'],
            'line_items[0][price_data][product_data][name]' => 'FitPlate ' . $plan['name'] . ' Üyelik',
            'line_items[0][price_data][recurring][interval]' => $plan['interval'],
            'line_items[0][price_data][unit_amount]' => (string)$plan['amount'],
            'line_items[0][quantity]' => '1',
            'metadata[plan]' => $planKey,
        ];

        $customerEmail = trim((string)($payload['email'] ?? ''));
        if ($customerEmail !== '') {
            $postData['customer_email'] = $customerEmail;
        }

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $stripeSecretKey,
                'Content-Type: application/x-www-form-urlencoded',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false || $curlError !== '') {
            ResponseHelper::error('Stripe bağlantısı sırasında hata oluştu.', 502);
            return;
        }

        $decoded = json_decode($response, true);

        if ($httpCode >= 400) {
            ResponseHelper::error('Stripe checkout oturumu oluşturulamadı.', $httpCode);
            return;
        }

        ResponseHelper::success([
            'sessionId' => $decoded['id'] ?? null,
            'checkoutUrl' => $decoded['url'] ?? null,
            'plan' => $planKey,
        ]);
    }

    public function handleWebhook(): void
    {
        $payload = file_get_contents('php://input') ?: '';
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $webhookSecret = getenv('STRIPE_WEBHOOK_SECRET') ?: '';

        if ($webhookSecret !== '' && !$this->isValidSignature($payload, $signature, $webhookSecret)) {
            ResponseHelper::error('Geçersiz Stripe imzası.', 400);
            return;
        }

        $event = json_decode($payload, true);
        $eventType = $event['type'] ?? 'unknown';

        // Webhook event'lerini DB'ye kaydet (opsiyonel)
        if ($this->db && isset($event['data']['object']['metadata']['plan'])) {
            $planKey = $event['data']['object']['metadata']['plan'];
            $customerEmail = $event['data']['object']['customer_email'] ?? '';

            // Başarılı ödeme event'lerinde üyelik güncelle
            if ($eventType === 'checkout.session.completed') {
                $stmt = $this->db->prepare(
                    "UPDATE kullanicilar SET uyelik_tipi = :plan WHERE email = :email"
                );
                $stmt->execute(['plan' => $planKey, 'email' => $customerEmail]);
            }
        }

        ResponseHelper::success([
            'received' => true,
            'eventType' => $eventType,
        ]);
    }

    private function isValidSignature(string $payload, string $signatureHeader, string $secret): bool
    {
        if ($signatureHeader === '') {
            return false;
        }

        $parts = explode(',', $signatureHeader);
        $timestamp = null;
        $signatures = [];

        foreach ($parts as $part) {
            $kv = explode('=', trim($part), 2);
            if (count($kv) !== 2) {
                continue;
            }

            if ($kv[0] === 't') {
                $timestamp = $kv[1];
            }

            if ($kv[0] === 'v1') {
                $signatures[] = $kv[1];
            }
        }

        if ($timestamp === null || empty($signatures)) {
            return false;
        }

        $signedPayload = $timestamp . '.' . $payload;
        $expected = hash_hmac('sha256', $signedPayload, $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        return false;
    }
}
