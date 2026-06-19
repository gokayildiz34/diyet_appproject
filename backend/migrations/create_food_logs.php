<?php
/*
|--------------------------------------------------------------------------
| Migration: Yemek Kayıtları Tablosu
|--------------------------------------------------------------------------
| Günlük yemek kaydı için yemek_kayitlari tablosunu oluşturur.
*/

$dotenv = parse_ini_file(__DIR__ . '/../.env');
foreach ($dotenv as $k => $v) putenv("$k=$v");
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();

$sql = "
CREATE TABLE IF NOT EXISTS yemek_kayitlari (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id    INT NOT NULL,
    ogun            ENUM('kahvalti','ogle','aksam','atistirmalik') NOT NULL DEFAULT 'ogle',
    yemek_adi       VARCHAR(255) NOT NULL,
    miktar_gram     DECIMAL(7,2) NOT NULL DEFAULT 100,
    kalori          DECIMAL(7,2) NOT NULL DEFAULT 0,
    protein_g       DECIMAL(7,2) NULL,
    karb_g          DECIMAL(7,2) NULL,
    yag_g           DECIMAL(7,2) NULL,
    kayit_tarihi    DATE NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kullanici_tarih (kullanici_id, kayit_tarihi),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

$db->exec($sql);
echo "✅ yemek_kayitlari tablosu oluşturuldu.\n";

$sql2 = "
CREATE TABLE IF NOT EXISTS su_kayitlari (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id    INT NOT NULL,
    bardak_sayisi   INT NOT NULL DEFAULT 1,
    kayit_tarihi    DATE NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_kullanici_tarih (kullanici_id, kayit_tarihi),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

$db->exec($sql2);
echo "✅ su_kayitlari tablosu oluşturuldu.\n";
