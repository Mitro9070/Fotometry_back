# Скрипт загрузки всех наблюдений с автопоиском спутников в каталоге
# =================================================================

$API_URL = "http://localhost:5000/api/v1"

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ЗАГРУЗКА ВСЕХ НАБЛЮДЕНИЙ В ЧИСТУЮ БД                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# СПУТНИКИ С КОНКРЕТНЫМИ NORAD ID
# ============================================
$satelliteMapping = @{
    "Centaur" = "00694"           # Centaur R/B
    "КА DSP (другой)" = "28158"   # USA 176 (DSP)
    "КА №123 (Горизонт)" = "19710" # Gorizont
    "КА №16 (DSP-F2)" = "07276"   # DSP F2
    "КА №21232 (Радуга-27)" = "21232" # Raduga 1
    "КА №214 (Экран-20)" = "20652"  # Ekran
    "КА Казсат" = "29642"          # KazSat 1
}

Write-Host "📡 Загрузка TLE данных из каталога..." -ForegroundColor Yellow
Write-Host ""

$satellitesData = @{}

foreach ($satName in $satelliteMapping.Keys) {
    $noradId = $satelliteMapping[$satName]
    Write-Host "  $satName (NORAD: $noradId)..." -NoNewline
    
    try {
        $result = Invoke-RestMethod -Uri "$API_URL/satellites/catalog/$noradId" -TimeoutSec 10 2>$null
        
        if ($result.success) {
            $satellitesData[$satName] = $result.satellite
            Write-Host " ✅ $($result.satellite.name)" -ForegroundColor Green
        } else {
            Write-Host " ⚠️ Не найден" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ❌ Ошибка" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "✅ Загружено TLE данных для: $($satellitesData.Count) спутников" -ForegroundColor Green
Write-Host ""

# ============================================
# СПИСОК ФАЙЛОВ НАБЛЮДЕНИЙ
# ============================================
$observationFiles = @()

# Centaur - 1 файл
$observationFiles += @{
    file = "test-data\Centaur\06092523.25E"
    satellite = "Centaur"
}

# КА DSP (другой) - 15 файлов
@(
    "1\09042224.15E", "2\09042224.30E", "3\09042224.59E", "4\09042225.14E",
    "5\09042225.29E", "6\09042226.50E", "7\09042227.05E", "8\09042227.18E"
) | ForEach-Object {
    $observationFiles += @{
        file = "test-data\КА DSP (другой)\090422\$_"
        satellite = "КА DSP (другой)"
    }
}

@(
    "1\09043023.48E", "2\09043024.37E", "3\09043024.50E", "4\09043025.13E",
    "5\09043025.28E", "6\09043025.49E", "7\09043026.04E"
) | ForEach-Object {
    $observationFiles += @{
        file = "test-data\КА DSP (другой)\090430\$_"
        satellite = "КА DSP (другой)"
    }
}

# КА №123 (Горизонт) - 1 файл
$observationFiles += @{
    file = "test-data\КА №123 (Горизонт)\06092522.48E"
    satellite = "КА №123 (Горизонт)"
}

# КА №16 (DSP-F2) - 1 файл
$observationFiles += @{
    file = "test-data\КА №16 (DSP-F2)\06111523.29E"
    satellite = "КА №16 (DSP-F2)"
}

# КА №21232 (Радуга-27) - 1 файл
$observationFiles += @{
    file = "test-data\КА №21232 (Радуга-27)\05110428.07E"
    satellite = "КА №21232 (Радуга-27)"
}

# КА №214 (Экран-20) - 5 файлов
@(
    "1-ая проводка\06092524.14E",
    "2-ая проводка\06092524.27E",
    "3-я проводка\06092524.39E",
    "4-ая проводка\06092524.51E",
    "5-ая проводка\06092525.04E"
) | ForEach-Object {
    $observationFiles += @{
        file = "test-data\КА №214 (Экран-20)\$_"
        satellite = "КА №214 (Экран-20)"
    }
}

# КА Казсат - 47 файлов
@(
    "060628\1\06062825.57E",
    "060628\2\06062826.14E",
    "060629\06062926.17E",
    "060630\1\06063025.01E",
    "060630\2\06063025.17E",
    "060630\3\06063026.36E",
    "060703\06070324.34E",
    "060720\1\06072023.12E",
    "060720\2\06072023.54E",
    "060724\06072424.11E",
    "060725\06072523.54E",
    "060728\06072823.29E",
    "060731\06073124.28E",
    "060802\06080223.50E",
    "070313\07031325.00E",
    "070314\07031424.21E",
    "080610 - начались постоянные нештатные ситуации (ст. от Диденко)\1\08061025.21E",
    "080610 - начались постоянные нештатные ситуации (ст. от Диденко)\2\08061025.46E",
    "080610 - начались постоянные нештатные ситуации (ст. от Диденко)\3\08061026.10E",
    "080610 - начались постоянные нештатные ситуации (ст. от Диденко)\4\08061026.27E",
    "080611-1\1\08061126.03E",
    "080611-1\2\08061126.16E",
    "080611-1\3\08061126.30E",
    "080612-1\1\08061224.27E",
    "080612-1\2\08061224.47E",
    "080612-1\3\08061225.00E",
    "080612-1\4\08061225.12E",
    "080612-1\5\08061225.24E",
    "080612-1\6\08061225.37E",
    "080612-1\7\08061226.17E",
    "080612-1\8\08061227.02E",
    "081125\08112525.35E",
    "081126\1\08112621.58E",
    "081126\2\08112622.21E",
    "081129\1\08112922.01E",
    "081129\2\08112922.17E",
    "081129\3\08112922.47E",
    "081129\4\08112923.03E",
    "081129\5\08112923.18E",
    "081129\6\08112923.33E",
    "081129\7\08112924.06E",
    "081129\8\08112924.21E",
    "081129\9\08112924.33E",
    "081129\10\08112924.50E",
    "081129\11\08112926.06E",
    "081202\1\08120223.32E",
    "081202\2\08120223.47E"
) | ForEach-Object {
    $observationFiles += @{
        file = "test-data\КА Казсат\$_"
        satellite = "КА Казсат"
    }
}

Write-Host "📊 Подготовлено к загрузке:" -ForegroundColor Cyan
$observationFiles | Group-Object satellite | Select-Object Name, Count | Format-Table

# ============================================
# ЗАГРУЗКА НАБЛЮДЕНИЙ
# ============================================
Write-Host "📥 Начало загрузки наблюдений..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0
$skipCount = 0
$progress = 0

foreach ($item in $observationFiles) {
    $progress++
    $filePath = $item.file
    $satName = $item.satellite
    
    if (-not (Test-Path $filePath)) {
        Write-Host "[$progress/$($observationFiles.Count)] ⚠️ Файл не найден: $filePath" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    if (-not $satellitesData.ContainsKey($satName)) {
        Write-Host "[$progress/$($observationFiles.Count)] ⚠️ Нет TLE для: $satName" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    $fileName = Split-Path $filePath -Leaf
    $satData = $satellitesData[$satName]
    
    Write-Host "[$progress/$($observationFiles.Count)] $fileName..." -NoNewline
    
    try {
        $satelliteData = @{
            name = $satData.name
            noradId = $satData.noradId
            line1 = $satData.line1
            line2 = $satData.line2
        } | ConvertTo-Json -Compress
        
        $response = curl.exe -X POST "$API_URL/ingest/file" `
            -F "file=@$filePath" `
            -F "satelliteData=$satelliteData" `
            -F "source=Full Dataset Upload" `
            2>$null | ConvertFrom-Json
        
        if ($response.observationId) {
            Write-Host " ✅ ID:$($response.observationId)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " ❌ $($response.message)" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        $errorCount++
    }
    
    if ($progress % 10 -eq 0) {
        Start-Sleep -Seconds 1
    } else {
        Start-Sleep -Milliseconds 300
    }
}

# ============================================
# ИТОГИ
# ============================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      ИТОГИ ЗАГРУЗКИ                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Успешно загружено: $successCount" -ForegroundColor Green
Write-Host "⚠️ Пропущено: $skipCount" -ForegroundColor Yellow
Write-Host "❌ Ошибок: $errorCount" -ForegroundColor Red
Write-Host "📊 Всего: $($observationFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# ПРОВЕРКА РЕЗУЛЬТАТОВ
Write-Host "📊 Проверка результатов..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $satellites = Invoke-RestMethod -Uri "$API_URL/satellites" 2>$null
    $observations = Invoke-RestMethod -Uri "$API_URL/observations?limit=200" 2>$null
    
    Write-Host ""
    Write-Host "🛰️  Спутников в БД: $($satellites.total)" -ForegroundColor Cyan
    Write-Host "📡 Наблюдений в БД: $($observations.pagination.total)" -ForegroundColor Cyan
    Write-Host ""
    
    # Распределение по спутникам
    Write-Host "📊 Распределение наблюдений по спутникам:" -ForegroundColor Yellow
    Write-Host ""
    
    $satGroups = $observations.data | Where-Object {$_.satelliteId} | Group-Object satelliteId
    
    foreach ($group in $satGroups) {
        $satId = $group.Name
        $count = $group.Count
        
        try {
            $satInfo = Invoke-RestMethod -Uri "$API_URL/satellites/$satId" 2>$null
            $satName = $satInfo.satellite.satelliteName
            $noradId = $satInfo.satellite.noradId
            
            Write-Host "  🛰️  $satName (NORAD: $noradId, ID: $satId)" -ForegroundColor Cyan
            Write-Host "      📡 Наблюдений: $count" -ForegroundColor Green
            Write-Host ""
        } catch {
            Write-Host "  Спутник ID:$satId - $count наблюдений" -ForegroundColor White
        }
    }
    
    # Проверка связей
    $withSatellite = ($observations.data | Where-Object {$_.satelliteId}).Count
    $withoutSatellite = ($observations.data | Where-Object {-not $_.satelliteId}).Count
    
    Write-Host "✅ Наблюдений со спутниками: $withSatellite" -ForegroundColor Green
    Write-Host "⚠️  Наблюдений без спутников: $withoutSatellite" -ForegroundColor $(if($withoutSatellite -eq 0){'Green'}else{'Yellow'})
    
} catch {
    Write-Host "Ошибка проверки: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Готово!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Swagger: http://localhost:5000/api/docs" -ForegroundColor Cyan

