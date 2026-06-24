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

            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey;
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
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

    /**
     * POST /api/ai/analyze-food-image
     * Yemek fotoğrafından kalori ve makro analizi yapar.
     */
    public function analyzeFoodImage(array $payload): void
    {
        set_time_limit(120); // API çağrısı uzun sürebilir
        $imageBase64 = is_array($payload['image']) ? ($payload['image']['data'] ?? '') : ($payload['image'] ?? '');
        $imageBase64 = (string) $imageBase64;
        $mimeType = $payload['mimeType'] ?? 'image/jpeg';

        if ($imageBase64 === '') {
            ResponseHelper::error('Resim verisi zorunludur.', 422);
            return;
        }

        if (str_starts_with($imageBase64, 'data:')) {
            $parts = explode(',', $imageBase64);
            if (count($parts) > 1) {
                $imageBase64 = $parts[1];
            }
        }

        $apiKey = getenv('GEMINI_API_KEY') ?: '';
        
        if (!empty($apiKey)) {
            $prompt = "Aşağıdaki yemek fotoğrafını analiz et ve sadece JSON olarak döndür. 
            Cevap şu formatta olmalıdır: 
            {\"food_name\": \"Tahmini Yemek Adı (Tüm tabak için)\", \"calories\": 450, \"protein\": 30, \"carbs\": 40, \"fat\": 15}
            SADECE JSON döndür.";

            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey;
            $data = [
                "contents" => [
                    [
                        "parts" => [
                            ["text" => $prompt],
                            [
                                "inlineData" => [
                                    "mimeType" => $mimeType,
                                    "data" => $imageBase64
                                ]
                            ]
                        ]
                    ]
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            $response = curl_exec($ch);
            curl_close($ch);

            if ($response) {
                $resData = json_decode($response, true);
                $jsonText = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
                $jsonText = trim(preg_replace('/```json\s*(.*?)\s*```/s', '$1', $jsonText));
                $jsonText = trim(preg_replace('/```\s*(.*?)\s*```/s', '$1', $jsonText));
                $parsed = json_decode($jsonText, true);
                if ($parsed && isset($parsed['calories'])) {
                    ResponseHelper::success([
                        'food_name' => $parsed['food_name'] ?? 'Fotoğraf Analizi',
                        'calories' => (float)$parsed['calories'],
                        'protein' => (float)($parsed['protein'] ?? 0),
                        'carbs' => (float)($parsed['carbs'] ?? 0),
                        'fat' => (float)($parsed['fat'] ?? 0),
                        'source' => 'Gemini AI Vision'
                    ]);
                    return;
                }
            } else {
                error_log("CURL Error: " . curl_error($ch));
            }
        }

        ResponseHelper::error('Fotoğraf analiz edilemedi veya API anahtarı geçersiz.', 500);
    }

    /**
     * POST /api/ai/coach-comment-feed-image
     * Keşfet kısmında paylaşılan fotoğrafa koç yorumu yapar ve post metadata içine kaydeder.
     */
    public function coachCommentFeedImage(array $payload): void
    {
        set_time_limit(120); // API çağrısı uzun sürebilir
        $userId = AuthMiddleware::authenticate();
        $postId = (int)($payload['post_id'] ?? 0);
        $imageUrl = $payload['image_url'] ?? '';
        $coachPersona = $payload['coachPersona'] ?? 'demir';

        if (!$postId || !$imageUrl) {
            ResponseHelper::error('Post ID ve image_url zorunludur.', 400);
            return;
        }

        $apiKey = getenv('GEMINI_API_KEY') ?: '';
        if (empty($apiKey)) {
            ResponseHelper::error('AI hizmeti şu an kullanılamıyor (API Key eksik).', 503);
            return;
        }

        $localPath = '';
        if (strpos($imageUrl, 'http') === 0) {
            $parsedUrl = parse_url($imageUrl);
            $localPath = __DIR__ . '/../public' . $parsedUrl['path'];
        } else {
            $localPath = __DIR__ . '/../public' . $imageUrl;
        }

        if (!file_exists($localPath)) {
            ResponseHelper::error('Görsel dosyası bulunamadı.', 404);
            return;
        }

        $imageData = file_get_contents($localPath);
        $base64Image = base64_encode($imageData);
        $mimeType = function_exists('mime_content_type') ? mime_content_type($localPath) : 'image/jpeg';

        $personaDetails = [
            'demir' => 'Sen Demir. Sert, disiplinli ve sonuç odaklı bir fitness koçusun. Bahane kabul etmezsin.',
            'ipek'  => 'Sen İpek. Empatik, motive edici, pozitif ve destekleyici bir yaşam koçusun. Her başarıyı kutlarsın.',
            'zen'   => 'Sen Zen. Sakin, dengeli, mindful yeme odaklı bir rehbersin. İç huzuru önemsersin.'
        ];
        $systemPrompt = $personaDetails[$coachPersona] ?? $personaDetails['demir'];
        $userPrompt = "Kullanıcı bu fotoğrafı beslenme akışında (Feed) paylaştı. Fotoğraftaki yiyeceğin kalorisini içinden tahmin et. Eğer çok yüksek kalorili, sağlıksız veya aşırı yağlı/şekerli bir yiyecekse (örn: hamburger, pizza, tatlı), koç karakterinin belirgin özelliğine göre (örn: Demir ise çok sert, fırçalayan ve taviz vermeyen; İpek ise üzülmüş ama tatlı bir sitemle uyaran; Zen ise dengenin bozulduğuna dikkat çeken) kötü ve uyarıcı bir yorum yap. Eğer sağlıklı ise överek destekle. Sadece koçun ağzından 1-2 cümlelik tepki yazısı yaz.";

        $apiPayload = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $systemPrompt . "\n\n" . $userPrompt],
                        [
                            "inlineData" => [
                                "mimeType" => $mimeType,
                                "data" => $base64Image
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($apiPayload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $result = json_decode($response, true);
            if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                $coachText = trim($result['candidates'][0]['content']['parts'][0]['text']);
                
                require_once __DIR__ . '/../config/database.php';
                require_once __DIR__ . '/../models/Post.php';
                $db = (new Database())->getConnection();
                $postModel = new Post($db);
                $post = $postModel->getById($postId);
                
                if ($post) {
                    $metadata = $post['metadata'] ? json_decode($post['metadata'], true) : [];
                    
                    $avatarMap = [
                        'demir' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demir&backgroundColor=b6e3f4',
                        'ipek'  => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ipek&backgroundColor=ffdfbf',
                        'zen'   => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zen&backgroundColor=c0aede'
                    ];
                    $colorMap = [
                        'demir' => '#3b82f6',
                        'ipek'  => '#f59e0b',
                        'zen'   => '#10b981'
                    ];
                    $nameMap = [
                        'demir' => 'Koç Demir',
                        'ipek'  => 'Koç İpek',
                        'zen'   => 'Rehber Zen'
                    ];

                    $metadata['coachComment'] = [
                        'coachName' => $nameMap[$coachPersona] ?? 'Koç',
                        'text' => $coachText,
                        'avatar' => $avatarMap[$coachPersona] ?? '',
                        'color' => $colorMap[$coachPersona] ?? '#7c3aed'
                    ];
                    
                    $postModel->updateMetadata($postId, $metadata);

                    // Bildirim Gönder (AI Koç Değerlendirmesi)
                    require_once __DIR__ . '/NotificationController.php';
                    $notifController = new NotificationController($db);
                    $notifController->sendPushToUserInternal(
                        (string)$userId,
                        $nameMap[$coachPersona] . " Yemeğini Değerlendirdi!",
                        mb_substr($coachText, 0, 40) . "...",
                        ['post_id' => $postId]
                    );
                    
                    ResponseHelper::success([
                        'coachComment' => $metadata['coachComment']
                    ]);
                    return;
                }
            } else {
                error_log("Gemini Error: " . $response);
            }
        }
        
        ResponseHelper::error('AI koç yorum üretemedi.', 500);
    }
}
