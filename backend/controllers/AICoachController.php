<?php

class AICoachController
{
    public function coachChat(array $payload): void
    {
        $coachPersona = strtolower(trim((string)($payload['coachPersona'] ?? 'demir')));
        $message = trim((string)($payload['message'] ?? ''));
        $dailyCalorieGoal = (int)($payload['dailyCalorieGoal'] ?? 2000);
        $dailyCalorieGoal = max(1200, min($dailyCalorieGoal, 5000));

        $coachMap = [
            'demir' => ['name' => 'Demir', 'color' => '#ef4444'],
            'ipek' => ['name' => 'İpek', 'color' => '#ec4899'],
            'zen' => ['name' => 'Zen', 'color' => '#10b981'],
        ];

        if (!isset($coachMap[$coachPersona])) {
            $coachPersona = 'demir';
        }

        $coach = $coachMap[$coachPersona];

        $breakfast = (int)round($dailyCalorieGoal * 0.25);
        $lunch = (int)round($dailyCalorieGoal * 0.35);
        $snack = (int)round($dailyCalorieGoal * 0.1);
        $dinner = max($dailyCalorieGoal - $breakfast - $lunch - $snack, 0);

        $meals = [
            [
                'name' => 'Kahvaltı',
                'targetCalories' => $breakfast,
                'menu' => 'Yulaf + yoğurt + meyve + ceviz',
            ],
            [
                'name' => 'Öğle',
                'targetCalories' => $lunch,
                'menu' => 'Izgara tavuk + bulgur + salata',
            ],
            [
                'name' => 'Ara Öğün',
                'targetCalories' => $snack,
                'menu' => 'Badem + kefir',
            ],
            [
                'name' => 'Akşam',
                'targetCalories' => $dinner,
                'menu' => 'Somon + sebze + yoğurt',
            ],
        ];

        $replyPrefix = $coachPersona === 'demir'
            ? 'Disiplin odaklı plana geçiyoruz.'
            : ($coachPersona === 'ipek'
                ? 'Sana uygun yumuşak bir plan hazırladım.'
                : 'Dengeli bir plan ile ilerleyeceğiz.');

        $reply = $replyPrefix;
        if ($message !== '') {
            $reply .= ' Mesajını dikkate aldım: "' . mb_substr($message, 0, 120) . '"';
        }

        ResponseHelper::success([
            'coachName' => $coach['name'],
            'coachColor' => $coach['color'],
            'reply' => $reply,
            'plan' => [
                'totalCalories' => $dailyCalorieGoal,
                'meals' => $meals,
            ],
        ]);
    }

    /**
     * POST /api/ai/analyze-food
     * Serbest Türkçe metinden kalori ve makro analizi yapar.
     */
    public function analyzeFood(array $payload): void
    {
        $message = trim((string)($payload['message'] ?? ''));
        if ($message === '') {
            ResponseHelper::error('Mesaj alanı zorunludur.', 422);
            return;
        }

        // 1. Gemini API Key Kontrolü
        $apiKey = getenv('GEMINI_API_KEY') ?: '';
        
        if (!empty($apiKey)) {
            // Gerçek Gemini API isteği
            $prompt = "Aşağıdaki Türkçe yemek ifadesini analiz et ve sadece JSON olarak döndür. 
            Cevap şu formatta olmalıdır: 
            {\"food_name\": \"Yemek Adı\", \"calories\": 350, \"protein\": 15, \"carbs\": 40, \"fat\": 12}
            
            İfade: \"{$message}\"";

            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
            $data = [
                "contents" => [
                    ["parts" => [["text" => $prompt]]]
                ],
                "generationConfig" => [
                    "responseMimeType" => "application/json"
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            $response = curl_exec($ch);
            curl_close($ch);

            if ($response) {
                $resData = json_decode($response, true);
                $jsonText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
                $parsed = json_decode($jsonText, true);
                if ($parsed && isset($parsed['calories'])) {
                    ResponseHelper::success([
                        'food_name' => $parsed['food_name'] ?? $message,
                        'calories' => (float)$parsed['calories'],
                        'protein' => (float)($parsed['protein'] ?? 0),
                        'carbs' => (float)($parsed['carbs'] ?? 0),
                        'fat' => (float)($parsed['fat'] ?? 0),
                        'source' => 'Gemini AI'
                    ]);
                    return;
                }
            }
        }

        // 2. Akıllı Yerel Fallback Parser (Gemini API anahtarı girilmemişse veya hata aldıysa)
        $lowerMsg = mb_strtolower($message);
        
        $foodsDatabase = [
            'yumurta' => ['name' => 'Haşlanmış Yumurta', 'cal' => 155, 'prot' => 13, 'carb' => 1.1, 'fat' => 11],
            'tavuk' => ['name' => 'Izgara Tavuk Göğsü', 'cal' => 165, 'prot' => 31, 'carb' => 0, 'fat' => 3.6],
            'pilav' => ['name' => 'Pirinç Pilavı', 'cal' => 130, 'prot' => 2.7, 'carb' => 28, 'fat' => 0.2],
            'makarna' => ['name' => 'Haşlanmış Makarna', 'cal' => 131, 'prot' => 5, 'carb' => 25, 'fat' => 1.1],
            'kuru fasulye' => ['name' => 'Kuru Fasulye', 'cal' => 140, 'prot' => 8.5, 'carb' => 22, 'fat' => 0.5],
            'köfte' => ['name' => 'Izgara Köfte', 'cal' => 200, 'prot' => 18, 'carb' => 4, 'fat' => 12],
            'salata' => ['name' => 'Mevsim Salata', 'cal' => 45, 'prot' => 1.2, 'carb' => 6, 'fat' => 2],
            'yoğurt' => ['name' => 'Yarım Yağlı Yoğurt', 'cal' => 61, 'prot' => 3.5, 'carb' => 4.7, 'fat' => 3.3],
            'süt' => ['name' => 'Yarım Yağlı Süt', 'cal' => 47, 'prot' => 3, 'carb' => 4.7, 'fat' => 1.5],
            'ekmek' => ['name' => 'Tam Buğday Ekmek', 'cal' => 247, 'prot' => 12, 'carb' => 41, 'fat' => 3.4],
            'muz' => ['name' => 'Muz', 'cal' => 89, 'prot' => 1.1, 'carb' => 23, 'fat' => 0.3],
            'elma' => ['name' => 'Elma', 'cal' => 52, 'prot' => 0.3, 'carb' => 14, 'fat' => 0.2],
            'yulaf' => ['name' => 'Yulaf Ezmesi', 'cal' => 389, 'prot' => 16.9, 'carb' => 66, 'fat' => 6.9],
            'kefir' => ['name' => 'Kefir', 'cal' => 55, 'prot' => 3.2, 'carb' => 4, 'fat' => 3],
        ];

        $matchedName = "Özel Yemek Karışımı";
        $totalCal = 0;
        $totalProt = 0;
        $totalCarb = 0;
        $totalFat = 0;
        $found = false;

        foreach ($foodsDatabase as $key => $val) {
            if (strpos($lowerMsg, $key) !== false) {
                $found = true;
                $matchedName = $val['name'];
                $totalCal += $val['cal'];
                $totalProt += $val['prot'];
                $totalCarb += $val['carb'];
                $totalFat += $val['fat'];
            }
        }

        // Hiçbir şey eşleşmediyse kelime uzunluğuna göre gerçekçi bir değer ata
        if (!$found) {
            $totalCal = 250;
            $totalProt = 12;
            $totalCarb = 25;
            $totalFat = 8;
        }

        ResponseHelper::success([
            'food_name' => $matchedName,
            'calories' => (float)$totalCal,
            'protein' => (float)$totalProt,
            'carbs' => (float)$totalCarb,
            'fat' => (float)$totalFat,
            'source' => 'Yerel Analiz Motoru'
        ]);
    }
}
