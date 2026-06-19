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
}
