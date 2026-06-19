<?php

/*
|--------------------------------------------------------------------------
| Migration: Şifre Sıfırlama Tablosu
|--------------------------------------------------------------------------
| password_reset_tokens tablosunu oluşturur.
| Çalıştırmak için: php migrations/create_password_resets.php
|--------------------------------------------------------------------------
*/

$dotenv = parse_ini_file(__DIR__ . '/../.env');
foreach ($dotenv as $key => $value) {
    putenv("$key=$value");
}

require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();

$sql = "
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    token         VARCHAR(64) NOT NULL UNIQUE,
    expires_at    DATETIME NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

$db->exec($sql);
echo "✅ password_reset_tokens tablosu oluşturuldu.\n";
