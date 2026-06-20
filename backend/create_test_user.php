<?php
// PHP CLI'da env dosyalarının okunması için loadEnv fonksiyonunu elle taklit ediyoruz veya index.php'deki mantığı alıyoruz.
function loadEnvLocal($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . "=" . trim($value));
    }
}

loadEnvLocal(__DIR__ . '/.env');

require_once "config/database.php";
require_once "models/User.php";

$database = new Database();
$db = $database->getConnection();

// Varsa eskiyi temizle
$db->exec("DELETE FROM kullanicilar WHERE eposta = 'test@test.com'");

$sifreHash = password_hash("123456", PASSWORD_BCRYPT);

// Kullanıcıyı ekle
$stmt = $db->prepare("INSERT INTO kullanicilar (ad, eposta, sifre_hash, koc_tipi, gunluk_kalori_hedefi, uyelik_tipi, onboarding_tamamlandi) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->execute(["Test Kullanıcısı", "test@test.com", $sifreHash, "demir", 2000, "premium", 1]);

echo "USER_RECREATED_CLEANLY_WITH_ENV\n";
?>
