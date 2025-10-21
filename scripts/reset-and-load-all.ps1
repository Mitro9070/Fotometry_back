# Скрипт полной очистки БД и загрузки всех наблюдений
# ============================================

$API_URL = "http://localhost:5000/api/v1"
$DB_CONNECTION = "postgresql://viktor9070:Barracuda1975_333@45.12.73.86:5432/photometry-root"

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ПОЛНАЯ ОЧИСТКА БД И ЗАГРУЗКА ВСЕХ НАБЛЮДЕНИЙ                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. ОЧИСТКА БАЗЫ ДАННЫХ
# ============================================
Write-Host "📋 Шаг 1: Очистка базы данных..." -ForegroundColor Yellow

$tables = @(
    "photometry.spectral_peaks",
    "photometry.summary_stats",
    "photometry.averaged_magnitudes",
    "photometry.instrumental_magnitudes",
    "photometry.raw_signals",
    "photometry.filter_experiments",
    "photometry.filters",
    "photometry.coordinates",
    "photometry.observations",
    "photometry.satellites"
)

foreach ($table in $tables) {
    Write-Host "  Очистка $table..." -NoNewline
    try {
        psql $DB_CONNECTION -c "TRUNCATE TABLE $table CASCADE;" 2>$null | Out-Null
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ⚠️" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ База данных очищена!" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. ОПРЕДЕЛЕНИЕ СПУТНИКОВ И ИХ ДАННЫХ
# ============================================
Write-Host "📋 Шаг 2: Подготовка данных спутников..." -ForegroundColor Yellow
Write-Host ""

# Данные спутников из каталога TLE
$satellites = @{
    "Centaur" = @{
        name = "Centaur"
        noradId = "00694"  # Примерный NORAD для Centaur R/B
        searchTerm = "Centaur"
    }
    "КА DSP (другой)" = @{
        name = "USA 176 (DSP)"
        noradId = "28158"
        searchTerm = "28158"
    }
    "КА №123 (Горизонт)" = @{
        name = "Horizont"
        noradId = "19710"  # Примерный для Горизонт
        searchTerm = "Horizont"
    }
    "КА №16 (DSP-F2)" = @{
        name = "DSP F2"
        noradId = "07276"  # DSP-F2
        searchTerm = "DSP"
    }
    "КА №21232 (Радуга-27)" = @{
        name = "Raduga"
        noradId = "21232"
        searchTerm = "Raduga"
    }
    "КА №214 (Экран-20)" = @{
        name = "Ekran"
        noradId = "20652"  # Примерный для Экран
        searchTerm = "Ekran"
    }
    "КА Казсат" = @{
        name = "Kazsat"
        noradId = "29642"  # KazSat
        searchTerm = "Kazsat"
    }
}

# Получаем актуальные TLE данные из каталога
foreach ($satName in $satellites.Keys) {
    $sat = $satellites[$satName]
    Write-Host "  Поиск в каталоге: $($sat.searchTerm)..." -NoNewline
    
    try {
        $searchResult = Invoke-RestMethod -Uri "$API_URL/satellites/catalog/search?query=$($sat.searchTerm)" 2>$null
        
        if ($searchResult.total -gt 0) {
            $catalogSat = $searchResult.satellites[0]
            $satellites[$satName].catalogData = $catalogSat
            Write-Host " ✅ Найден: $($catalogSat.name) ($($catalogSat.noradId))" -ForegroundColor Green
        } else {
            Write-Host " ⚠️ Не найден в каталоге" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ❌ Ошибка поиска" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# 3. СБОР ВСЕХ ФАЙЛОВ НАБЛЮДЕНИЙ
# ============================================
Write-Host "📋 Шаг 3: Сбор файлов наблюдений..." -ForegroundColor Yellow
Write-Host ""

$observationFiles = @()

# Centaur
$observationFiles += @{
    file = "test-data\Centaur\06092523.25E"
    satellite = "Centaur"
}

# КА DSP (другой)
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
    $observationFiles += @{
        file = $_
        satellite = "КА DSP (другой)"
    }
}

# КА №123 (Горизонт)
$observationFiles += @{
    file = "test-data\КА №123 (Горизонт)\06092522.48E"
    satellite = "КА №123 (Горизонт)"
}

# КА №16 (DSP-F2)
$observationFiles += @{
    file = "test-data\КА №16 (DSP-F2)\06111523.29E"
    satellite = "КА №16 (DSP-F2)"
}

# КА №21232 (Радуга-27)
$observationFiles += @{
    file = "test-data\КА №21232 (Радуга-27)\05110428.07E"
    satellite = "КА №21232 (Радуга-27)"
}

# КА №214 (Экран-20)
@(
    "test-data\КА №214 (Экран-20)\1-ая проводка\06092524.14E",
    "test-data\КА №214 (Экран-20)\2-ая проводка\06092524.27E",
    "test-data\КА №214 (Экран-20)\3-я проводка\06092524.39E",
    "test-data\КА №214 (Экран-20)\4-ая проводка\06092524.51E",
    "test-data\КА №214 (Экран-20)\5-ая проводка\06092525.04E"
) | ForEach-Object {
    $observationFiles += @{
        file = $_
        satellite = "КА №214 (Экран-20)"
    }
}

# КА Казсат
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
    $observationFiles += @{
        file = $_
        satellite = "КА Казсат"
    }
}

Write-Host "✅ Подготовлено файлов: $($observationFiles.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Распределение по спутникам:"
$observationFiles | Group-Object satellite | Select-Object Name, Count | Format-Table

# ============================================
# 4. ЗАГРУЗКА НАБЛЮДЕНИЙ
# ============================================
Write-Host "📋 Шаг 4: Загрузка наблюдений в БД..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$errorCount = 0
$skipCount = 0
$results = @()

foreach ($item in $observationFiles) {
    $filePath = $item.file
    $satName = $item.satellite
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️ Файл не найден: $filePath" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    $fileName = Split-Path $filePath -Leaf
    $satInfo = $satellites[$satName]
    
    if (-not $satInfo.catalogData) {
        Write-Host "⚠️ Нет TLE данных для: $satName" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    
    Write-Host "[$successCount/$($observationFiles.Count)] $fileName ($satName)..." -NoNewline
    
    try {
        $satelliteData = @{
            name = $satInfo.catalogData.name
            noradId = $satInfo.catalogData.noradId
            line1 = $satInfo.catalogData.line1
            line2 = $satInfo.catalogData.line2
        } | ConvertTo-Json -Compress
        
        $response = curl.exe -X POST "$API_URL/ingest/file" `
            -F "file=@$filePath" `
            -F "satelliteData=$satelliteData" `
            -F "source=Batch Upload $(Get-Date -Format 'yyyy-MM-dd HH:mm')" `
            2>$null | ConvertFrom-Json
        
        if ($response.status -eq "stored") {
            Write-Host " ✅ ID: $($response.observationId)" -ForegroundColor Green
            $successCount++
        } elseif ($response.statusCode -eq 409) {
            Write-Host " ⚠️ Дубликат" -ForegroundColor Yellow
            $skipCount++
        } else {
            Write-Host " ❌ Статус: $($response.status)" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host " ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    
    Start-Sleep -Milliseconds 300
}

# ============================================
# 5. ПРОВЕРКА РЕЗУЛЬТАТОВ
# ============================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   ИТОГИ ЗАГРУЗКИ                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Успешно загружено: $successCount" -ForegroundColor Green
Write-Host "⚠️ Пропущено/дубликатов: $skipCount" -ForegroundColor Yellow
Write-Host "❌ Ошибок: $errorCount" -ForegroundColor Red
Write-Host "📊 Всего обработано: $($observationFiles.Count)" -ForegroundColor Cyan
Write-Host ""

# Проверяем что в БД
Write-Host "📊 Проверка базы данных..." -ForegroundColor Yellow
Write-Host ""

try {
    $satCount = (Invoke-RestMethod -Uri "$API_URL/satellites" 2>$null).total
    $obsData = Invoke-RestMethod -Uri "$API_URL/observations?limit=200" 2>$null
    $obsCount = $obsData.pagination.total
    $obsWithSat = ($obsData.data | Where-Object {$_.satelliteId -ne $null}).Count
    
    Write-Host "Спутников в БД: $satCount" -ForegroundColor White
    Write-Host "Наблюдений всего: $obsCount" -ForegroundColor White
    Write-Host "Наблюдений со спутниками: $obsWithSat" -ForegroundColor Green
    Write-Host ""
    
    # Распределение по спутникам
    Write-Host "Распределение наблюдений по спутникам:" -ForegroundColor Yellow
    $obsData.data | Where-Object {$_.satelliteId -ne $null} | 
        Group-Object satelliteId | 
        ForEach-Object {
            $satId = $_.Name
            $count = $_.Count
            $satInfo = Invoke-RestMethod -Uri "$API_URL/satellites/$satId" 2>$null
            Write-Host "  Спутник #$satId ($($satInfo.satellite.satelliteName)): $count наблюдений" -ForegroundColor Cyan
        }
    
} catch {
    Write-Host "Ошибка проверки БД: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Готово!" -ForegroundColor Green

