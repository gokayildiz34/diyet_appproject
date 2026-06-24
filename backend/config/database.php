<?php

/*
|--------------------------------------------------------------------------
| DIYET APP - Veritabanı Bağlantı Yapılandırması
|--------------------------------------------------------------------------
|
| Bu dosya, MySQL veritabanına PDO üzerinden bağlantı kuran Database
| sınıfını içerir. Uygulama genelinde veritabanı işlemleri için
| tek bir bağlantı noktası sağlar (Singleton benzeri yapı).
|
| Görevleri:
|   - MySQL veritabanına güvenli PDO bağlantısı oluşturmak
|   - Bağlantı ayarlarını ortam değişkenlerinden (.env) okumak
|   - Hata durumunda anlamlı JSON hata mesajı döndürmek
|   - UTF-8 karakter seti desteği sağlamak
|
| Varsayılan Ayarlar:
|   Host     : localhost
|   Database : diyet_app
|   User     : root
|   Password : (boş)
|
|--------------------------------------------------------------------------
*/

class Database
{
    private string $host;
    private int $port;
    private string $dbName;
    private string $username;
    private string $password;
    private ?PDO $conn = null;

    public function __construct()
    {
        $this->host = $_ENV['MYSQLHOST'] ?? ($_ENV['DB_HOST'] ?? '127.0.0.1');
        $this->port = (int) ($_ENV['MYSQLPORT'] ?? ($_ENV['DB_PORT'] ?? 3306));
        $this->dbName = $_ENV['MYSQLDATABASE'] ?? ($_ENV['DB_NAME'] ?? 'diyet_app');
        $this->username = $_ENV['MYSQLUSER'] ?? ($_ENV['DB_USER'] ?? 'root');
        $this->password = $_ENV['MYSQLPASSWORD'] ?? ($_ENV['DB_PASS'] ?? '');
        
    }

    public function getConnection(): PDO
    {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbName};charset=utf8mb4";
                $this->conn = new PDO($dsn, $this->username, $this->password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "message" => "Veritabanı bağlantı hatası: " . $e->getMessage()
                ]);
                exit();
            }
        }

        return $this->conn;
    }
}
