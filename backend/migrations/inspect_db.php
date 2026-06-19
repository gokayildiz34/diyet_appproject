<?php
$url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=elma&search_simple=1&action=process&json=1&page_size=5&fields=product_name,brands,nutriments';
$ctx = stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'FitPlate/1.0']]);
$raw = @file_get_contents($url, false, $ctx);

if (!$raw) {
    echo "HATA: file_get_contents basarisiz\n";
    echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'ACIK' : 'KAPALI') . "\n";
} else {
    $d = json_decode($raw, true);
    $count = count($d['products'] ?? []);
    echo "Urun sayisi: $count\n";
    if ($count > 0) {
        $p  = $d['products'][0];
        $n  = $p['nutriments'] ?? [];
        echo "Ilk urun: " . ($p['product_name'] ?? 'yok') . "\n";
        echo "energy-kcal_100g: " . ($n['energy-kcal_100g'] ?? 'YOK') . "\n";
        echo "energy_100g: " . ($n['energy_100g'] ?? 'YOK') . "\n";
        echo "proteins_100g: " . ($n['proteins_100g'] ?? 'YOK') . "\n";
    }
}
