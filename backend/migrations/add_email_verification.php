<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = (new Database())->getConnection();

    // 1. Add email_verified_at and verification_token to kullanicilar table
    $sql = "
        ALTER TABLE kullanicilar 
        ADD COLUMN email_verified_at DATETIME NULL AFTER eposta,
        ADD COLUMN verification_token VARCHAR(10) NULL AFTER email_verified_at;
    ";
    
    // Check if columns already exist
    $checkSql = "SHOW COLUMNS FROM kullanicilar LIKE 'email_verified_at'";
    $stmt = $db->query($checkSql);
    
    if ($stmt->rowCount() == 0) {
        $db->exec($sql);
        echo "Added email_verified_at and verification_token columns to kullanicilar.\n";
        
        // 2. Mark existing users as verified
        $updateSql = "UPDATE kullanicilar SET email_verified_at = NOW() WHERE email_verified_at IS NULL";
        $db->exec($updateSql);
        echo "Marked existing users as verified.\n";
    } else {
        echo "Columns already exist in kullanicilar.\n";
    }

    // 3. For password_reset_tokens table, the token is currently VARCHAR(255).
    // Let's truncate it or just leave it as is, since we will store a 6 digit code there.
    // The password_reset_tokens table already exists from create_password_resets.php.

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
