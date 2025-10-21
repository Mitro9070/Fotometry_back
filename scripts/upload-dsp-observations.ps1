# Скрипт для массовой загрузки наблюдений DSP спутника

$API_URL = "http://localhost:5000/api/v1/ingest/file"

# Данные спутника USA 176 (DSP) из каталога
$satelliteData = @{
    name = "USA 176 (DSP)"
    noradId = "28158"
    line1 = "1 28158U 04004A   25260.84925737 -.00000175  00000-0  00000-0 0  9996"
    line2 = "2 28158  11.6893  28.0035 0003220 221.0279 317.5155  1.00272798 30200"
} | ConvertTo-Json -Compress

# Список всех файлов наблюдений
$files = @(
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
)

$results = @()
$successCount = 0
$errorCount = 0

Write-Host "=== Начало загрузки наблюдений DSP ===" -ForegroundColor Cyan
Write-Host "Всего файлов: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Файл не найден: $file" -ForegroundColor Red
        $errorCount++
        continue
    }

    $fileName = Split-Path $file -Leaf
    Write-Host "Загрузка: $fileName..." -NoNewline
    
    try {
        $response = curl.exe -X POST $API_URL `
            -F "file=@$file" `
            -F "satelliteData=$satelliteData" `
            -F "source=DSP Observations Batch Upload" `
            2>$null | ConvertFrom-Json

        if ($response.status -eq "stored") {
            Write-Host " ✅ ID: $($response.observationId)" -ForegroundColor Green
            $successCount++
            $results += @{
                file = $fileName
                observationId = $response.observationId
                status = "success"
            }
        } else {
            Write-Host " ⚠️ Статус: $($response.status)" -ForegroundColor Yellow
            $results += @{
                file = $fileName
                status = "unknown"
                response = $response
            }
        }
    } catch {
        Write-Host " ❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
        $results += @{
            file = $fileName
            status = "error"
            error = $_.Exception.Message
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== Итоги загрузки ===" -ForegroundColor Cyan
Write-Host "✅ Успешно загружено: $successCount" -ForegroundColor Green
Write-Host "❌ Ошибок: $errorCount" -ForegroundColor Red
Write-Host "📊 Всего обработано: $($files.Count)" -ForegroundColor Yellow

# Проверяем количество наблюдений для спутника
Write-Host ""
Write-Host "Проверка связей..." -ForegroundColor Cyan
$observations = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/observations?limit=100" 2>$null
$dspObservations = $observations.data | Where-Object { $_.satelliteId -ne $null }
Write-Host "Наблюдений со спутниками: $($dspObservations.Count)" -ForegroundColor Green

