<?php

/*
|--------------------------------------------------------------------------
| FoodLogController - Yemek Kaydı ve Su Takibi
|--------------------------------------------------------------------------
| GET  /api/food-log?date=YYYY-MM-DD  → Günlük kayıtlar
| POST /api/food-log                  → Yemek ekle
| DELETE /api/food-log/{id}           → Yemek sil
| GET  /api/food-log/search?q=elma   → Open Food Facts arama
| POST /api/water                     → Su güncelle
| GET  /api/water?date=YYYY-MM-DD    → Su kaydı getir
|--------------------------------------------------------------------------
*/

class FoodLogController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/food-log?date=YYYY-MM-DD
     * Günlük yemek kayıtlarını öğünlere göre döner
     */
    public function index(): void
    {
        $userId = AuthMiddleware::authenticate();
        $date   = $_GET['date'] ?? date('Y-m-d');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = date('Y-m-d');
        }

        $stmt = $this->db->prepare(
            "SELECT id, ogun, yemek_adi, miktar_gram, kalori, protein_g, karb_g, yag_g
             FROM yemek_kayitlari
             WHERE kullanici_id = ? AND kayit_tarihi = ?
             ORDER BY olusturulma_tarihi ASC"
        );
        $stmt->execute([$userId, $date]);
        $rows = $stmt->fetchAll();

        // Öğünlere ayır
        $meals = [
            'kahvalti'    => ['label' => 'Kahvaltı',      'items' => []],
            'ogle'        => ['label' => 'Öğle Yemeği',   'items' => []],
            'aksam'       => ['label' => 'Akşam Yemeği',  'items' => []],
            'atistirmalik'=> ['label' => 'Atıştırmalık',  'items' => []],
        ];

        $totalCalories = 0;
        $totalProtein  = 0;
        $totalCarb     = 0;
        $totalFat      = 0;

        foreach ($rows as $row) {
            $meals[$row['ogun']]['items'][] = [
                'id'       => (int) $row['id'],
                'name'     => $row['yemek_adi'],
                'amount'   => (float) $row['miktar_gram'],
                'calories' => (float) $row['kalori'],
                'protein'  => $row['protein_g'] !== null ? (float) $row['protein_g'] : null,
                'carbs'    => $row['karb_g'] !== null ? (float) $row['karb_g'] : null,
                'fat'      => $row['yag_g'] !== null ? (float) $row['yag_g'] : null,
            ];
            $totalCalories += (float) $row['kalori'];
            $totalProtein  += (float) ($row['protein_g'] ?? 0);
            $totalCarb     += (float) ($row['karb_g'] ?? 0);
            $totalFat      += (float) ($row['yag_g'] ?? 0);
        }

        ResponseHelper::success([
            'date'   => $date,
            'meals'  => $meals,
            'totals' => [
                'calories' => round($totalCalories, 1),
                'protein'  => round($totalProtein, 1),
                'carbs'    => round($totalCarb, 1),
                'fat'      => round($totalFat, 1),
            ],
        ]);
    }

    /**
     * POST /api/food-log
     * Yeni yemek kaydı ekle
     */
    public function store(array $payload): void
    {
        $userId   = AuthMiddleware::authenticate();

        $ogun     = $payload['meal'] ?? 'ogle';
        $name     = trim($payload['name'] ?? '');
        $amount   = (float) ($payload['amount'] ?? 100);
        $calories = (float) ($payload['calories'] ?? 0);
        $protein  = isset($payload['protein']) ? (float) $payload['protein'] : null;
        $carbs    = isset($payload['carbs'])   ? (float) $payload['carbs']   : null;
        $fat      = isset($payload['fat'])     ? (float) $payload['fat']     : null;
        $date     = $payload['date'] ?? date('Y-m-d');

        $validMeals = ['kahvalti', 'ogle', 'aksam', 'atistirmalik'];
        if (!in_array($ogun, $validMeals, true)) $ogun = 'ogle';
        if ($name === '') { ResponseHelper::error('Yemek adı zorunludur.', 422); return; }

        // Miktara göre kalori/makro oranla (100g baz alınarak girilir)
        $ratio    = $amount / 100;
        $calFinal = round($calories * $ratio, 1);
        $proFinal = $protein !== null ? round($protein * $ratio, 1) : null;
        $carbFinal= $carbs !== null   ? round($carbs * $ratio, 1)   : null;
        $fatFinal = $fat !== null     ? round($fat * $ratio, 1)     : null;

        $stmt = $this->db->prepare(
            "INSERT INTO yemek_kayitlari
             (kullanici_id, ogun, yemek_adi, miktar_gram, kalori, protein_g, karb_g, yag_g, kayit_tarihi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $ogun, $name, $amount, $calFinal, $proFinal, $carbFinal, $fatFinal, $date]);

        ResponseHelper::success([
            'id'       => (int) $this->db->lastInsertId(),
            'name'     => $name,
            'meal'     => $ogun,
            'amount'   => $amount,
            'calories' => $calFinal,
            'protein'  => $proFinal,
            'carbs'    => $carbFinal,
            'fat'      => $fatFinal,
            'date'     => $date,
        ], 201);
    }

    /**
     * DELETE /api/food-log/{id}
     */
    public function destroy(int $id): void
    {
        $userId = AuthMiddleware::authenticate();

        $stmt = $this->db->prepare(
            "DELETE FROM yemek_kayitlari WHERE id = ? AND kullanici_id = ?"
        );
        $stmt->execute([$id, $userId]);

        if ($stmt->rowCount() === 0) {
            ResponseHelper::error('Kayıt bulunamadı.', 404);
            return;
        }

        ResponseHelper::success(['message' => 'Yemek kaydı silindi.']);
    }

    /**
     * GET /api/food-log/search?q=elma
     * Open Food Facts API proxy — CORS sorununu aşmak için
     */
    public function search(): void
    {
        AuthMiddleware::authenticate();

        $q = trim($_GET['q'] ?? '');
        if (strlen($q) < 2) {
            ResponseHelper::success(['products' => []]);
            return;
        }

        $url = 'https://world.openfoodfacts.org/cgi/search.pl?'
            . http_build_query([
                'search_terms'      => $q,
                'search_simple'     => 1,
                'action'            => 'process',
                'json'              => 1,
                'page_size'         => 15,
                'fields'            => 'product_name,brands,nutriments,serving_size',
                'lc'                => 'tr',
            ]);

        $ctx = stream_context_create([
            'http' => [
                'timeout'       => 6,
                'user_agent'    => 'FitPlate/1.0',
                'ignore_errors' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            ResponseHelper::success(['products' => [], 'error' => 'Arama servisi geçici olarak kullanılamıyor.']);
            return;
        }

        $data     = json_decode($raw, true);
        $products = [];

        foreach (($data['products'] ?? []) as $p) {
            $name = trim($p['product_name'] ?? '');
            if ($name === '') continue;

            $n = $p['nutriments'] ?? [];
            $products[] = [
                'name'     => $name . ($p['brands'] ? ' (' . explode(',', $p['brands'])[0] . ')' : ''),
                'calories' => round((float) ($n['energy-kcal_100g'] ?? $n['energy_100g'] ?? 0) / ($n['energy_100g'] ?? 1) > 10
                    ? ($n['energy-kcal_100g'] ?? 0)
                    : ($n['energy_100g'] ?? 0) / 4.184, 1),
                'protein'  => round((float) ($n['proteins_100g'] ?? 0), 1),
                'carbs'    => round((float) ($n['carbohydrates_100g'] ?? 0), 1),
                'fat'      => round((float) ($n['fat_100g'] ?? 0), 1),
            ];
        }

        // Kalori sıfır olanları filtrele
        $products = array_values(array_filter($products, fn($p) => $p['calories'] > 0));

        ResponseHelper::success(['products' => array_slice($products, 0, 12)]);
    }

    /**
     * POST /api/water  {date, glasses}
     */
    public function upsertWater(array $payload): void
    {
        $userId  = AuthMiddleware::authenticate();
        $date    = $payload['date'] ?? date('Y-m-d');
        $glasses = max(0, min(20, (int) ($payload['glasses'] ?? 1)));

        $stmt = $this->db->prepare(
            "INSERT INTO su_kayitlari (kullanici_id, bardak_sayisi, kayit_tarihi)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE bardak_sayisi = VALUES(bardak_sayisi)"
        );
        $stmt->execute([$userId, $glasses, $date]);

        ResponseHelper::success(['date' => $date, 'glasses' => $glasses]);
    }

    /**
     * GET /api/water?date=YYYY-MM-DD
     */
    public function getWater(): void
    {
        $userId = AuthMiddleware::authenticate();
        $date   = $_GET['date'] ?? date('Y-m-d');

        $stmt = $this->db->prepare(
            "SELECT bardak_sayisi FROM su_kayitlari
             WHERE kullanici_id = ? AND kayit_tarihi = ?"
        );
        $stmt->execute([$userId, $date]);
        $row = $stmt->fetch();

        ResponseHelper::success(['date' => $date, 'glasses' => $row ? (int) $row['bardak_sayisi'] : 0]);
    }
}
