<?php

/*
|--------------------------------------------------------------------------
| FoodLogController - Yemek Kaydı ve Su Takibi
|--------------------------------------------------------------------------
| GET  /api/food-log?date=YYYY-MM-DD  → Günlük kayıtlar
| POST /api/food-log                  → Yemek ekle
| DELETE /api/food-log/{id}           → Yemek sil
| GET  /api/food-log/search?q=elma   → Besin arama (Open Food Facts + Yerleşik DB)
| POST /api/water                     → Su güncelle
| GET  /api/water?date=YYYY-MM-DD    → Su kaydı getir
|--------------------------------------------------------------------------
*/

class FoodLogController
{
    private PDO $db;

    /**
     * Türk mutfağı ve yaygın yiyecekler için yerleşik besin veritabanı
     * (100g başına değerler: kalori, protein, karbonhidrat, yağ)
     */
    private array $builtinFoods = [
        // Tahıllar & Ekmek
        ['name' => 'Beyaz Pirinç (Pişmiş)',    'calories' => 130, 'protein' => 2.7,  'carbs' => 28.2, 'fat' => 0.3],
        ['name' => 'Bulgur (Pişmiş)',           'calories' => 83,  'protein' => 3.1,  'carbs' => 18.6, 'fat' => 0.2],
        ['name' => 'Makarna (Pişmiş)',          'calories' => 131, 'protein' => 5.0,  'carbs' => 25.0, 'fat' => 1.1],
        ['name' => 'Ekmek (Beyaz)',             'calories' => 265, 'protein' => 9.0,  'carbs' => 49.0, 'fat' => 3.2],
        ['name' => 'Tam Buğday Ekmeği',         'calories' => 247, 'protein' => 13.0, 'carbs' => 41.0, 'fat' => 4.2],
        ['name' => 'Pide',                      'calories' => 280, 'protein' => 9.5,  'carbs' => 54.0, 'fat' => 3.0],
        ['name' => 'Simit',                     'calories' => 297, 'protein' => 9.5,  'carbs' => 57.0, 'fat' => 4.1],
        ['name' => 'Yulaf Ezmesi (Pişmiş)',     'calories' => 68,  'protein' => 2.4,  'carbs' => 12.0, 'fat' => 1.4],

        // Et & Tavuk & Balık
        ['name' => 'Tavuk Göğsü (Pişmiş)',     'calories' => 165, 'protein' => 31.0, 'carbs' => 0.0,  'fat' => 3.6],
        ['name' => 'Tavuk But (Pişmiş)',        'calories' => 209, 'protein' => 26.0, 'carbs' => 0.0,  'fat' => 11.0],
        ['name' => 'Dana Kıyma (Pişmiş)',       'calories' => 215, 'protein' => 26.0, 'carbs' => 0.0,  'fat' => 12.0],
        ['name' => 'Dana Biftek (Pişmiş)',      'calories' => 250, 'protein' => 26.0, 'carbs' => 0.0,  'fat' => 16.0],
        ['name' => 'Kuzu Eti (Pişmiş)',         'calories' => 258, 'protein' => 25.0, 'carbs' => 0.0,  'fat' => 17.0],
        ['name' => 'Somon (Pişmiş)',            'calories' => 208, 'protein' => 20.0, 'carbs' => 0.0,  'fat' => 13.0],
        ['name' => 'Ton Balığı (Konserve)',     'calories' => 128, 'protein' => 28.0, 'carbs' => 0.0,  'fat' => 1.0],
        ['name' => 'Hamsi (Pişmiş)',            'calories' => 131, 'protein' => 20.0, 'carbs' => 0.0,  'fat' => 5.0],
        ['name' => 'Sucuk',                     'calories' => 450, 'protein' => 19.0, 'carbs' => 2.0,  'fat' => 40.0],
        ['name' => 'Köfte (Pişmiş)',            'calories' => 220, 'protein' => 22.0, 'carbs' => 3.0,  'fat' => 13.0],
        ['name' => 'Kavurma',                   'calories' => 280, 'protein' => 25.0, 'carbs' => 0.0,  'fat' => 20.0],
        ['name' => 'Tavuk Döner',               'calories' => 185, 'protein' => 24.0, 'carbs' => 2.0,  'fat' => 9.0],

        // Süt & Yumurta
        ['name' => 'Yumurta (Haşlanmış)',       'calories' => 155, 'protein' => 13.0, 'carbs' => 1.1,  'fat' => 11.0],
        ['name' => 'Süt (Tam Yağlı)',           'calories' => 61,  'protein' => 3.2,  'carbs' => 4.8,  'fat' => 3.3],
        ['name' => 'Yoğurt (Sade)',             'calories' => 59,  'protein' => 3.5,  'carbs' => 4.7,  'fat' => 3.3],
        ['name' => 'Ayran',                     'calories' => 35,  'protein' => 2.0,  'carbs' => 2.8,  'fat' => 1.7],
        ['name' => 'Beyaz Peynir',              'calories' => 264, 'protein' => 18.0, 'carbs' => 2.0,  'fat' => 20.0],
        ['name' => 'Kaşar Peyniri',             'calories' => 384, 'protein' => 25.0, 'carbs' => 0.5,  'fat' => 32.0],
        ['name' => 'Lor Peyniri',               'calories' => 98,  'protein' => 12.0, 'carbs' => 3.0,  'fat' => 4.3],
        ['name' => 'Tereyağı',                  'calories' => 717, 'protein' => 0.9,  'carbs' => 0.1,  'fat' => 81.0],

        // Baklagiller
        ['name' => 'Mercimek Çorbası',          'calories' => 80,  'protein' => 5.0,  'carbs' => 12.0, 'fat' => 1.5],
        ['name' => 'Kırmızı Mercimek (Pişmiş)', 'calories' => 116, 'protein' => 9.0,  'carbs' => 20.0, 'fat' => 0.4],
        ['name' => 'Nohut (Pişmiş)',            'calories' => 164, 'protein' => 9.0,  'carbs' => 27.0, 'fat' => 2.6],
        ['name' => 'Fasulye (Pişmiş)',          'calories' => 127, 'protein' => 8.7,  'carbs' => 22.8, 'fat' => 0.5],
        ['name' => 'Kuru Fasulye Yemeği',       'calories' => 120, 'protein' => 7.0,  'carbs' => 18.0, 'fat' => 3.0],

        // Sebzeler
        ['name' => 'Domates',                   'calories' => 18,  'protein' => 0.9,  'carbs' => 3.9,  'fat' => 0.2],
        ['name' => 'Salatalık',                 'calories' => 15,  'protein' => 0.7,  'carbs' => 3.6,  'fat' => 0.1],
        ['name' => 'Marul',                     'calories' => 15,  'protein' => 1.4,  'carbs' => 2.9,  'fat' => 0.2],
        ['name' => 'Biber (Yeşil)',             'calories' => 20,  'protein' => 0.9,  'carbs' => 4.6,  'fat' => 0.2],
        ['name' => 'Ispanak',                   'calories' => 23,  'protein' => 2.9,  'carbs' => 3.6,  'fat' => 0.4],
        ['name' => 'Havuç',                     'calories' => 41,  'protein' => 0.9,  'carbs' => 9.6,  'fat' => 0.2],
        ['name' => 'Patates (Haşlanmış)',       'calories' => 87,  'protein' => 1.9,  'carbs' => 20.0, 'fat' => 0.1],
        ['name' => 'Patlıcan',                  'calories' => 25,  'protein' => 1.0,  'carbs' => 5.9,  'fat' => 0.2],
        ['name' => 'Kabak',                     'calories' => 17,  'protein' => 1.2,  'carbs' => 3.6,  'fat' => 0.2],
        ['name' => 'Soğan',                     'calories' => 40,  'protein' => 1.1,  'carbs' => 9.3,  'fat' => 0.1],
        ['name' => 'Sarımsak',                  'calories' => 149, 'protein' => 6.4,  'carbs' => 33.1, 'fat' => 0.5],
        ['name' => 'Brokoli',                   'calories' => 34,  'protein' => 2.8,  'carbs' => 7.0,  'fat' => 0.4],

        // Meyveler
        ['name' => 'Elma',                      'calories' => 52,  'protein' => 0.3,  'carbs' => 14.0, 'fat' => 0.2],
        ['name' => 'Muz',                       'calories' => 89,  'protein' => 1.1,  'carbs' => 23.0, 'fat' => 0.3],
        ['name' => 'Portakal',                  'calories' => 47,  'protein' => 0.9,  'carbs' => 12.0, 'fat' => 0.1],
        ['name' => 'Üzüm',                      'calories' => 69,  'protein' => 0.7,  'carbs' => 18.1, 'fat' => 0.2],
        ['name' => 'Çilek',                     'calories' => 32,  'protein' => 0.7,  'carbs' => 7.7,  'fat' => 0.3],
        ['name' => 'Karpuz',                    'calories' => 30,  'protein' => 0.6,  'carbs' => 7.6,  'fat' => 0.2],
        ['name' => 'Kavun',                     'calories' => 34,  'protein' => 0.8,  'carbs' => 8.2,  'fat' => 0.2],
        ['name' => 'Armut',                     'calories' => 57,  'protein' => 0.4,  'carbs' => 15.2, 'fat' => 0.1],

        // Kuruyemiş & Yağlar
        ['name' => 'Ceviz',                     'calories' => 654, 'protein' => 15.0, 'carbs' => 14.0, 'fat' => 65.0],
        ['name' => 'Badem',                     'calories' => 579, 'protein' => 21.0, 'carbs' => 22.0, 'fat' => 50.0],
        ['name' => 'Fındık',                    'calories' => 628, 'protein' => 15.0, 'carbs' => 17.0, 'fat' => 61.0],
        ['name' => 'Fıstık Ezmesi',             'calories' => 588, 'protein' => 25.0, 'carbs' => 20.0, 'fat' => 50.0],
        ['name' => 'Zeytinyağı',                'calories' => 884, 'protein' => 0.0,  'carbs' => 0.0,  'fat' => 100.0],
        ['name' => 'Ayçiçek Yağı',             'calories' => 884, 'protein' => 0.0,  'carbs' => 0.0,  'fat' => 100.0],
        ['name' => 'Zeytin (Siyah)',            'calories' => 115, 'protein' => 0.8,  'carbs' => 6.3,  'fat' => 10.7],

        // Türk Yemekleri
        ['name' => 'İmam Bayıldı',              'calories' => 118, 'protein' => 2.0,  'carbs' => 8.0,  'fat' => 9.0],
        ['name' => 'Dolma (Zeytinyağlı)',       'calories' => 125, 'protein' => 3.0,  'carbs' => 16.0, 'fat' => 5.5],
        ['name' => 'Menemen',                   'calories' => 145, 'protein' => 8.0,  'carbs' => 7.0,  'fat' => 10.0],
        ['name' => 'Çorba (Ezogelin)',          'calories' => 75,  'protein' => 4.5,  'carbs' => 12.0, 'fat' => 1.5],
        ['name' => 'Pilav (Tavuklu)',           'calories' => 150, 'protein' => 8.0,  'carbs' => 22.0, 'fat' => 3.5],
        ['name' => 'Börek (Peynirli)',          'calories' => 290, 'protein' => 10.0, 'carbs' => 28.0, 'fat' => 16.0],
        ['name' => 'Lahmacun',                  'calories' => 250, 'protein' => 12.0, 'carbs' => 34.0, 'fat' => 8.0],
        ['name' => 'Pide (Peynirli)',           'calories' => 275, 'protein' => 12.0, 'carbs' => 35.0, 'fat' => 10.0],
        ['name' => 'Kebap (Adana)',             'calories' => 266, 'protein' => 20.0, 'carbs' => 2.0,  'fat' => 20.0],
        ['name' => 'Karnıyarık',               'calories' => 150, 'protein' => 8.0,  'carbs' => 10.0, 'fat' => 9.0],
        ['name' => 'Meze (Humus)',              'calories' => 177, 'protein' => 8.0,  'carbs' => 20.0, 'fat' => 8.0],

        // Atıştırmalıklar & Fast Food
        ['name' => 'Bisküvi (Sade)',            'calories' => 450, 'protein' => 7.0,  'carbs' => 70.0, 'fat' => 16.0],
        ['name' => 'Çikolata (Sütlü)',         'calories' => 535, 'protein' => 7.7,  'carbs' => 59.0, 'fat' => 30.0],
        ['name' => 'Dondurma (Vanilyalı)',      'calories' => 207, 'protein' => 3.5,  'carbs' => 24.0, 'fat' => 11.0],
        ['name' => 'Pizza (Peynirli)',          'calories' => 266, 'protein' => 11.0, 'carbs' => 33.0, 'fat' => 10.0],
        ['name' => 'Burger (Sade)',             'calories' => 295, 'protein' => 17.0, 'carbs' => 24.0, 'fat' => 14.0],
        ['name' => 'Patates Kızartması',        'calories' => 312, 'protein' => 3.4,  'carbs' => 41.0, 'fat' => 15.0],

        // İçecekler
        ['name' => 'Çay (Şekersiz)',           'calories' => 1,   'protein' => 0.0,  'carbs' => 0.3,  'fat' => 0.0],
        ['name' => 'Kahve (Sade)',              'calories' => 2,   'protein' => 0.3,  'carbs' => 0.0,  'fat' => 0.0],
        ['name' => 'Meyve Suyu (Portakal)',     'calories' => 45,  'protein' => 0.7,  'carbs' => 10.4, 'fat' => 0.2],
        ['name' => 'Kola',                      'calories' => 42,  'protein' => 0.0,  'carbs' => 10.6, 'fat' => 0.0],
        ['name' => 'Protein Tozu (Whey)',       'calories' => 370, 'protein' => 80.0, 'carbs' => 6.0,  'fat' => 4.0],
    ];

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * GET /api/food-log?date=YYYY-MM-DD
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

        // Miktara göre oranla (değerler 100g baz alınarak girilir)
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
     * GET /api/food-log/weekly?from=YYYY-MM-DD
     * Son 7 günün günlük kalori toplamını döner (takvim sidebar için)
     */
    public function weekly(): void
    {
        $userId = AuthMiddleware::authenticate();
        $from   = $_GET['from'] ?? date('Y-m-d', strtotime('-6 days'));

        $stmt = $this->db->prepare(
            "SELECT kayit_tarihi, SUM(kalori) as toplam_kalori,
                    SUM(protein_g) as toplam_protein,
                    SUM(karb_g) as toplam_karb,
                    SUM(yag_g) as toplam_yag,
                    COUNT(*) as yemek_sayisi
             FROM yemek_kayitlari
             WHERE kullanici_id = ? AND kayit_tarihi >= ?
             GROUP BY kayit_tarihi
             ORDER BY kayit_tarihi ASC"
        );
        $stmt->execute([$userId, $from]);
        $rows = $stmt->fetchAll();

        $summary = [];
        foreach ($rows as $row) {
            $summary[$row['kayit_tarihi']] = [
                'calories'   => round((float) $row['toplam_kalori'], 0),
                'protein'    => round((float) $row['toplam_protein'], 0),
                'carbs'      => round((float) $row['toplam_karb'], 0),
                'fat'        => round((float) $row['toplam_yag'], 0),
                'food_count' => (int) $row['yemek_sayisi'],
            ];
        }

        ResponseHelper::success(['summary' => $summary]);
    }

    /**
     * POST /api/food-log/copy-from-yesterday
     * Dünkü yemek kayıtlarını bugüne kopyala
     */
    public function copyFromYesterday(array $payload): void
    {
        $userId   = AuthMiddleware::authenticate();
        $today    = $payload['today'] ?? date('Y-m-d');
        $yesterday= date('Y-m-d', strtotime($today . ' -1 day'));

        // Dünkü kayıtları getir
        $stmt = $this->db->prepare(
            "SELECT ogun, yemek_adi, miktar_gram, kalori, protein_g, karb_g, yag_g
             FROM yemek_kayitlari
             WHERE kullanici_id = ? AND kayit_tarihi = ?"
        );
        $stmt->execute([$userId, $yesterday]);
        $rows = $stmt->fetchAll();

        if (empty($rows)) {
            ResponseHelper::error('Dünkü kayıt bulunamadı.', 404);
            return;
        }

        // Bugünkü kayıtları temizle (üzerine yaz)
        $del = $this->db->prepare(
            "DELETE FROM yemek_kayitlari WHERE kullanici_id = ? AND kayit_tarihi = ?"
        );
        $del->execute([$userId, $today]);

        // Dünküleri bugüne kaydet
        $ins = $this->db->prepare(
            "INSERT INTO yemek_kayitlari
             (kullanici_id, ogun, yemek_adi, miktar_gram, kalori, protein_g, karb_g, yag_g, kayit_tarihi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        foreach ($rows as $row) {
            $ins->execute([
                $userId, $row['ogun'], $row['yemek_adi'], $row['miktar_gram'],
                $row['kalori'], $row['protein_g'], $row['karb_g'], $row['yag_g'], $today
            ]);
        }

        ResponseHelper::success([
            'message' => count($rows) . ' yemek kaydı kopyalandı.',
            'count'   => count($rows),
        ]);
    }

    /**
     * GET /api/food-log/search?q=...
     * Önce yerleşik Türkçe veritabanında ara, sonra Open Food Facts'i dene
     */
    public function search(): void
    {
        AuthMiddleware::authenticate();

        $q = mb_strtolower(trim($_GET['q'] ?? ''), 'UTF-8');
        if (mb_strlen($q, 'UTF-8') < 2) {
            ResponseHelper::success(['products' => []]);
            return;
        }

        // 1. Yerleşik veritabanında ara
        $builtinResults = [];
        foreach ($this->builtinFoods as $food) {
            $foodName = mb_strtolower($food['name'], 'UTF-8');
            if (mb_strpos($foodName, $q, 0, 'UTF-8') !== false) {
                $builtinResults[] = $food;
            }
        }

        // 2. Open Food Facts'i dene (ek sonuçlar için)
        $offResults = [];
        $url = 'https://world.openfoodfacts.org/cgi/search.pl?' . http_build_query([
            'search_terms'  => $q,
            'search_simple' => 1,
            'action'        => 'process',
            'json'          => 1,
            'page_size'     => 10,
            'fields'        => 'product_name,brands,nutriments',
            'lc'            => 'tr',
        ]);

        $ctx = stream_context_create([
            'http' => ['timeout' => 4, 'user_agent' => 'FitPlate/1.0', 'ignore_errors' => true],
        ]);

        $raw = @file_get_contents($url, false, $ctx);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            foreach (($data['products'] ?? []) as $p) {
                $name = trim($p['product_name'] ?? '');
                if ($name === '') continue;

                $n = $p['nutriments'] ?? [];
                $energyKcal = (float) ($n['energy-kcal_100g'] ?? ($n['energy_100g'] ?? 0) / 4.184);
                if ($energyKcal <= 0) continue;

                $brand = !empty($p['brands']) ? ' (' . explode(',', $p['brands'])[0] . ')' : '';
                $offResults[] = [
                    'name'     => $name . $brand,
                    'calories' => round($energyKcal, 1),
                    'protein'  => round((float) ($n['proteins_100g'] ?? 0), 1),
                    'carbs'    => round((float) ($n['carbohydrates_100g'] ?? 0), 1),
                    'fat'      => round((float) ($n['fat_100g'] ?? 0), 1),
                ];
            }
        }

        // Birleştir: önce yerleşik, sonra OFF
        $all = array_merge($builtinResults, $offResults);

        ResponseHelper::success(['products' => array_slice($all, 0, 15)]);
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
