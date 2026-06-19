<?php
/*
|--------------------------------------------------------------------------
| Migration: Kullanıcılar Tablosu Genişletme (MySQL 5.7 uyumlu)
|--------------------------------------------------------------------------
*/

$dotenv = parse_ini_file(__DIR__ . '/../.env');
foreach ($dotenv as $k => $v) putenv("$k=$v");
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$dbName = getenv('DB_NAME') ?: 'diyet_app';

// Mevcut kolonları getir
$stmt = $db->prepare(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'kullanicilar'"
);
$stmt->execute([$dbName]);
$existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

echo "Mevcut kolonlar: " . implode(', ', $existing) . "\n\n";

// Eklenecek kolonlar: [kolon_adi => SQL parçası]
$newColumns = [
    'uyelik_tipi'       => "ADD COLUMN uyelik_tipi VARCHAR(20) NOT NULL DEFAULT 'free' AFTER sifre_hash",
    'profil_foto'       => "ADD COLUMN profil_foto VARCHAR(500) NULL",
    'bio'               => "ADD COLUMN bio TEXT NULL",
    'hedef'             => "ADD COLUMN hedef VARCHAR(30) NULL COMMENT 'lose/gain/maintain/health'",
    'cinsiyet'          => "ADD COLUMN cinsiyet VARCHAR(20) NULL COMMENT 'male/female/other'",
    'yas'               => "ADD COLUMN yas TINYINT UNSIGNED NULL",
    'boy_cm'            => "ADD COLUMN boy_cm DECIMAL(5,1) NULL",
    'kilo_kg'           => "ADD COLUMN kilo_kg DECIMAL(5,2) NULL",
    'hedef_kilo_kg'     => "ADD COLUMN hedef_kilo_kg DECIMAL(5,2) NULL",
    'aktivite_seviyesi' => "ADD COLUMN aktivite_seviyesi VARCHAR(20) NULL COMMENT 'sedentary/light/moderate/active'",
];

foreach ($newColumns as $col => $sqlPart) {
    if (in_array($col, $existing, true)) {
        echo "⚠️  '$col' zaten var, atlandı.\n";
        continue;
    }
    try {
        $db->exec("ALTER TABLE kullanicilar $sqlPart");
        echo "✅ '$col' kolonu eklendi.\n";
    } catch (PDOException $e) {
        echo "❌ '$col' hatası: " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Migration tamamlandı.\n";
