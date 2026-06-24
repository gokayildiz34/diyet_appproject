CREATE TABLE IF NOT EXISTS kullanicilar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ad VARCHAR(100) NOT NULL,
    eposta VARCHAR(255) NOT NULL UNIQUE,
    sifre_hash VARCHAR(255) NOT NULL,
    koc_tipi VARCHAR(20) DEFAULT NULL,
    gunluk_kalori_hedefi INT DEFAULT 2000,
    uyelik_tipi VARCHAR(20) DEFAULT 'free',
    onboarding_tamamlandi TINYINT(1) DEFAULT 0,
    email_verified TINYINT(1) DEFAULT 0,
    email_verify_token VARCHAR(100) DEFAULT NULL,
    profil_foto_url VARCHAR(500) DEFAULT NULL,
    boy_cm DECIMAL(5,1) DEFAULT NULL,
    kilo_kg DECIMAL(5,2) DEFAULT NULL,
    yas INT DEFAULT NULL,
    cinsiyet VARCHAR(20) DEFAULT NULL,
    aktivite_seviyesi VARCHAR(30) DEFAULT NULL,
    hedef VARCHAR(50) DEFAULT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guncelleme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kullanicilar_eposta (eposta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pr_email (email),
    INDEX idx_pr_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gonderiler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id INT NOT NULL,
    icerik TEXT NOT NULL,
    gorsel_url VARCHAR(500) DEFAULT NULL,
    tur VARCHAR(30) DEFAULT 'text',
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gonderiler_kullanici (kullanici_id),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS begeniler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gonderi_id INT NOT NULL,
    kullanici_id INT NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_begeni (gonderi_id, kullanici_id),
    FOREIGN KEY (gonderi_id) REFERENCES gonderiler(id) ON DELETE CASCADE,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yorumlar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gonderi_id INT NOT NULL,
    kullanici_id INT NOT NULL,
    icerik TEXT NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gonderi_id) REFERENCES gonderiler(id) ON DELETE CASCADE,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diyet_planlari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id INT NOT NULL,
    koc_tipi VARCHAR(20) NOT NULL DEFAULT 'demir',
    toplam_kalori INT NOT NULL DEFAULT 2000,
    plan_tarihi DATE NOT NULL,
    koc_mesaji TEXT DEFAULT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diyet_plan_ogunleri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    ogun_adi VARCHAR(50) NOT NULL,
    hedef_kalori INT NOT NULL,
    menu TEXT NOT NULL,
    sira INT DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES diyet_planlari(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS haftalik_checkinler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id INT NOT NULL,
    kilo_kg DECIMAL(5,2) NOT NULL,
    bel_cm DECIMAL(5,2) DEFAULT NULL,
    uyku_saat DECIMAL(3,1) DEFAULT NULL,
    enerji_puani INT DEFAULT 5,
    uyum_puani INT DEFAULT 50,
    notlar TEXT DEFAULT NULL,
    foto_url VARCHAR(500) DEFAULT NULL,
    checkin_tarihi DATE NOT NULL,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS arkadasliklar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isteyen_id INT NOT NULL,
    alici_id INT NOT NULL,
    durum ENUM('beklemede','kabul_edildi','reddedildi') DEFAULT 'beklemede',
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_arkadaslik (isteyen_id, alici_id),
    FOREIGN KEY (isteyen_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
    FOREIGN KEY (alici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bildirimler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id INT NOT NULL,
    tur VARCHAR(50) NOT NULL DEFAULT 'genel',
    baslik VARCHAR(255) NOT NULL,
    mesaj TEXT NOT NULL,
    veri JSON DEFAULT NULL,
    okundu TINYINT(1) DEFAULT 0,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS yemek_kayitlari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kullanici_id INT NOT NULL,
    tarih DATE NOT NULL,
    ogun VARCHAR(50) DEFAULT 'kahvalti',
    yemek_adi VARCHAR(255) NOT NULL,
    miktar_gram DECIMAL(8,2) DEFAULT 100,
    kalori DECIMAL(8,2) DEFAULT 0,
    protein_g DECIMAL(8,2) DEFAULT 0,
    karbonhidrat_g DECIMAL(8,2) DEFAULT 0,
    yag_g DECIMAL(8,2) DEFAULT 0,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_yemek_tarih (kullanici_id, tarih),
    FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
