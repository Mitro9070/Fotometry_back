# ФИНАЛЬНЫЙ СКРИПТ ЗАГРУЗКИ ВСЕХ НАБЛЮДЕНИЙ
# Все спутники и файлы подготовлены
# ===========================================

$ErrorActionPreference = "Continue"
$API = "http://localhost:5000/api/v1"

Write-Host "🚀 ЗАГРУЗКА ВСЕХ НАБЛЮДЕНИЙ" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$totalLoaded = 0

# ============================================
# 1. DSP (USA 176) - NORAD: 28158 - 15 файлов
# ============================================
Write-Host "📡 [1/7] DSP (USA 176)" -ForegroundColor Yellow
$dspTle = '{"name":"USA 176","noradId":"28158","line1":"1 28158U 04004A   25260.84925737 -.00000175  00000-0  00000-0 0  9996","line2":"2 28158  11.6893  28.0035 0003220 221.0279 317.5155  1.00272798 30200"}'

@(
    "test-data\КА DSP (другой)\090422\1\09042224.15E",
    "test-data\КА DSP (другой)\090422\2\09042224.30E",
    "test-data\КА DSP (другой)\090422\3\09042224.59E",
    "test-data\КА DSP (другой)\090422\4\09042225.14E",
    "test-data\КА DSP (другой)\090422\5\09042225.29E",
    "test-data\КА DSP (другой)\090422\6\09042226.50E",
    "test-data\КА DSP (другой)\090422\7\09042227.05E",
    "test-data\КА DSP (другой)\090422\8\09042227.18E",
    "test-data\КА DSP (другой)\090430\1\09043023.48E",
    "test-data\КА DSP (другой)\090430\2\09043024.37E",
    "test-data\КА DSP (другой)\090430\3\09043024.50E",
    "test-data\КА DSP (другой)\090430\4\09043025.13E",
    "test-data\КА DSP (другой)\090430\5\09043025.28E",
    "test-data\КА DSP (другой)\090430\6\09043025.49E",
    "test-data\КА DSP (другой)\090430\7\09043026.04E"
) | ForEach-Object {
    $result = curl.exe -X POST "$API/ingest/file" -F "file=@$_" -F "satelliteData=$dspTle" 2>$null | ConvertFrom-Json
    if($result.observationId){ Write-Host "  ✅ $(Split-Path $_ -Leaf) -> $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }
    Start-Sleep -Milliseconds 300
}

# ============================================
# 2. Казсат - NORAD: 28496 - 47 файлов
# ============================================
Write-Host ""
Write-Host "📡 [2/7] КА Казсат (KazSat)" -ForegroundColor Yellow
# Поиск спутника в каталоге
$kazsatSearch = curl.exe -s "$API/satellites/catalog/search?query=28496" 2>$null | ConvertFrom-Json
if($kazsatSearch.total -gt 0) {
    $kazsatSat = $kazsatSearch.satellites[0]
    $kazsatTle = "{`"name`":`"$($kazsatSat.name)`",`"noradId`":`"$($kazsatSat.noradId)`",`"line1`":`"$($kazsatSat.line1)`",`"line2`":`"$($kazsatSat.line2)`"}"
    Write-Host "  TLE: $($kazsatSat.name) ($($kazsatSat.noradId))" -ForegroundColor Green
} else {
    # Используем резервные TLE данные для Казсата
    $kazsatTle = '{"name":"KazSat-1","noradId":"28496","line1":"1 28496U 06026A   25261.50000000  .00000100  00000-0  10000-3 0  9990","line2":"2 28496   0.1000  90.0000 0001000 180.0000   0.0000  1.00270000000000"}'
    Write-Host "  TLE: Резервные данные" -ForegroundColor Yellow
}

@(
    "test-data\КА Казсат\060628\1\06062825.57E",
    "test-data\КА Казсат\060628\2\06062826.14E",
    "test-data\КА Казсат\060629\06062926.17E",
    "test-data\КА Казсат\060630\1\06063025.01E",
    "test-data\КА Казсат\060630\2\06063025.17E",
    "test-data\КА Казсат\060630\3\06063026.36E",
    "test-data\КА Казсат\060703\06070324.34E",
    "test-data\КА Казсат\060720\1\06072023.12E",
    "test-data\КА Казсат\060720\2\06072023.54E",
    "test-data\КА Казсат\060724\06072424.11E",
    "test-data\КА Казсат\060725\06072523.54E",
    "test-data\КА Казсат\060728\06072823.29E",
    "test-data\КА Казсат\060731\06073124.28E",
    "test-data\КА Казсат\060802\06080223.50E",
    "test-data\КА Казсат\070313\07031325.00E",
    "test-data\КА Казсат\070314\07031424.21E",
    "test-data\КА Казсат\080610 - начались постоянные нештатные ситуации (ст. от Диденко)\1\08061025.21E",
    "test-data\КА Казсат\080610 - начались постоянные нештатные ситуации (ст. от Диденко)\2\08061025.46E",
    "test-data\КА Казсат\080610 - начались постоянные нештатные ситуации (ст. от Диденко)\3\08061026.10E",
    "test-data\КА Казсат\080610 - начались постоянные нештатные ситуации (ст. от Диденко)\4\08061026.27E",
    "test-data\КА Казсат\080611-1\1\08061126.03E",
    "test-data\КА Казсат\080611-1\2\08061126.16E",
    "test-data\КА Казсат\080611-1\3\08061126.30E",
    "test-data\КА Казсат\080612-1\1\08061224.27E",
    "test-data\КА Казсат\080612-1\2\08061224.47E",
    "test-data\КА Казсат\080612-1\3\08061225.00E",
    "test-data\КА Казсат\080612-1\4\08061225.12E",
    "test-data\КА Казсат\080612-1\5\08061225.24E",
    "test-data\КА Казсат\080612-1\6\08061225.37E",
    "test-data\КА Казсат\080612-1\7\08061226.17E",
    "test-data\КА Казсат\080612-1\8\08061227.02E",
    "test-data\КА Казсат\081125\08112525.35E",
    "test-data\КА Казсат\081126\1\08112621.58E",
    "test-data\КА Казсат\081126\2\08112622.21E",
    "test-data\КА Казсат\081129\1\08112922.01E",
    "test-data\КА Казсат\081129\2\08112922.17E",
    "test-data\КА Казсат\081129\3\08112922.47E",
    "test-data\КА Казсат\081129\4\08112923.03E",
    "test-data\КА Казсат\081129\5\08112923.18E",
    "test-data\КА Казсат\081129\6\08112923.33E",
    "test-data\КА Казсат\081129\7\08112924.06E",
    "test-data\КА Казсат\081129\8\08112924.21E",
    "test-data\КА Казсат\081129\9\08112924.33E",
    "test-data\КА Казсат\081129\10\08112924.50E",
    "test-data\КА Казсат\081129\11\08112926.06E",
    "test-data\КА Казсат\081202\1\08120223.32E",
    "test-data\КА Казсат\081202\2\08120223.47E"
) | ForEach-Object {
    $result = curl.exe -X POST "$API/ingest/file" -F "file=@$_" -F "satelliteData=$kazsatTle" 2>$null | ConvertFrom-Json
    if($result.observationId){ $totalLoaded++; if($totalLoaded % 5 -eq 0){ Write-Host "  ✅ Загружено: $totalLoaded" -ForegroundColor Green } }
    Start-Sleep -Milliseconds 300
}

Write-Host "  ✅ Казсат: 47 файлов обработано" -ForegroundColor Green

# ============================================
# 3-7. Остальные спутники
# ============================================

# Centaur
Write-Host ""
Write-Host "📡 [3/7] Centaur" -ForegroundColor Yellow
$centaurTle = '{"name":"CENTAUR R/B","noradId":"00694","line1":"1 00694U 63039C   25261.11706314  .00000186  00000-0  68093-4 0  9997","line2":"2 00694  28.9451  69.1682 0599473  43.5569 320.8024 13.16341074756895"}'
$result = curl.exe -X POST "$API/ingest/file" -F "file=@test-data\Centaur\06092523.25E" -F "satelliteData=$centaurTle" 2>$null | ConvertFrom-Json
if($result.observationId){ Write-Host "  ✅ ID: $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }

# Горизонт
Write-Host ""
Write-Host "📡 [4/7] Горизонт" -ForegroundColor Yellow
$gorizontTle = '{"name":"Gorizont","noradId":"19710","line1":"1 19710U 88109A   25261.50000000  .00000100  00000-0  10000-3 0  9990","line2":"2 19710   1.5000  90.0000 0005000 180.0000   0.0000  1.00270000000000"}'
$result = curl.exe -X POST "$API/ingest/file" -F "file=@test-data\КА №123 (Горизонт)\06092522.48E" -F "satelliteData=$gorizontTle" 2>$null | ConvertFrom-Json
if($result.observationId){ Write-Host "  ✅ ID: $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }

# DSP-F2
Write-Host ""
Write-Host "📡 [5/7] DSP-F2" -ForegroundColor Yellow
$dspf2Tle = '{"name":"DSP F2","noradId":"07276","line1":"1 07276U 74027A   25261.50000000  .00000100  00000-0  10000-3 0  9990","line2":"2 07276  10.0000 120.0000 0010000 180.0000   0.0000  1.00270000000000"}'
$result = curl.exe -X POST "$API/ingest/file" -F "file=@test-data\КА №16 (DSP-F2)\06111523.29E" -F "satelliteData=$dspf2Tle" 2>$null | ConvertFrom-Json
if($result.observationId){ Write-Host "  ✅ ID: $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }

# Радуга-27
Write-Host ""
Write-Host "📡 [6/7] Радуга-27" -ForegroundColor Yellow
$radugaTle = '{"name":"Raduga-1","noradId":"21232","line1":"1 21232U 91033A   25261.50000000  .00000100  00000-0  10000-3 0  9990","line2":"2 21232   1.5000  90.0000 0005000 180.0000   0.0000  1.00270000000000"}'
$result = curl.exe -X POST "$API/ingest/file" -F "file=@test-data\КА №21232 (Радуга-27)\05110428.07E" -F "satelliteData=$radugaTle" 2>$null | ConvertFrom-Json
if($result.observationId){ Write-Host "  ✅ ID: $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }

# Экран-20
Write-Host ""
Write-Host "📡 [7/7] Экран-20" -ForegroundColor Yellow
$ekranTle = '{"name":"Ekran","noradId":"20652","line1":"1 20652U 90058A   25261.50000000  .00000100  00000-0  10000-3 0  9990","line2":"2 20652   1.0000  90.0000 0003000 180.0000   0.0000  1.00270000000000"}'

@(
    "test-data\КА №214 (Экран-20)\1-ая проводка\06092524.14E",
    "test-data\КА №214 (Экран-20)\2-ая проводка\06092524.27E",
    "test-data\КА №214 (Экран-20)\3-я проводка\06092524.39E",
    "test-data\КА №214 (Экран-20)\4-ая проводка\06092524.51E",
    "test-data\КА №214 (Экран-20)\5-ая проводка\06092525.04E"
) | ForEach-Object {
    $result = curl.exe -X POST "$API/ingest/file" -F "file=@$_" -F "satelliteData=$ekranTle" 2>$null | ConvertFrom-Json
    if($result.observationId){ Write-Host "  ✅ $(Split-Path $_ -Leaf) -> $($result.observationId)" -ForegroundColor Green; $totalLoaded++ }
    Start-Sleep -Milliseconds 300
}

# ============================================
# ИТОГИ
# ============================================
Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Загружено наблюдений: $totalLoaded" -ForegroundColor Green
Write-Host ""

# Проверка результатов
Start-Sleep -Seconds 2
$satellites = Invoke-RestMethod -Uri "$API/satellites" 2>$null
$observations = Invoke-RestMethod -Uri "$API/observations?limit=200" 2>$null

Write-Host "📊 ПРОВЕРКА БАЗЫ ДАННЫХ:" -ForegroundColor Cyan
Write-Host "  Спутников: $($satellites.total)" -ForegroundColor White
Write-Host "  Наблюдений: $($observations.pagination.total)" -ForegroundColor White
Write-Host ""

Write-Host "📊 Распределение по спутникам:" -ForegroundColor Yellow
$observations.data | Where-Object {$_.satelliteId} | Group-Object satelliteId | ForEach-Object {
    $satId = $_.Name
    $count = $_.Count
    $satInfo = Invoke-RestMethod -Uri "$API/satellites/$satId" 2>$null
    Write-Host "  🛰️  $($satInfo.satellite.satelliteName) (NORAD: $($satInfo.satellite.noradId))" -ForegroundColor Cyan
    Write-Host "      📡 Наблюдений: $count" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Готово!" -ForegroundColor Green

