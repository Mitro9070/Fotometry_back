# Скрипт для мониторинга бэкенда в реальном времени
Write-Host "🔍 МОНИТОРИНГ БЭКЕНДА" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Нажми Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

$logFile = "logs\application-$(Get-Date -Format 'yyyy-MM-dd').log"
$errorFile = "logs\error-$(Get-Date -Format 'yyyy-MM-dd').log"

# Получаем текущий размер файлов
$lastAppSize = (Get-Item $logFile -ErrorAction SilentlyContinue).Length
if (!$lastAppSize) { $lastAppSize = 0 }

$lastErrSize = (Get-Item $errorFile -ErrorAction SilentlyContinue).Length
if (!$lastErrSize) { $lastErrSize = 0 }

$counter = 0

while ($true) {
    $counter++
    Clear-Host
    
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🔍 МОНИТОРИНГ БЭКЕНДА - Цикл #$counter" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Время: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    
    # Проверка процессов
    $processes = Get-Process | Where-Object {$_.ProcessName -eq 'node'} -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "✅ Процессы node: $($processes.Count)" -ForegroundColor Green
        $processes | Format-Table Id, @{Label='CPU';Expression={$_.CPU.ToString("F2")}}, @{Label='Memory MB';Expression={($_.WS/1MB).ToString("F0")}}
    } else {
        Write-Host "❌ НЕТ ПРОЦЕССОВ NODE!" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Проверка порта 5000
    $port = netstat -ano | Select-String ":5000" | Select-String "LISTENING"
    if ($port) {
        Write-Host "✅ Порт 5000: СЛУШАЕТСЯ" -ForegroundColor Green
    } else {
        Write-Host "❌ Порт 5000: НЕ СЛУШАЕТСЯ" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Проверка API
    try {
        $result = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/satellites" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✅ API отвечает: HTTP $($result.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ API НЕ ОТВЕЧАЕТ: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "───────────────────────────────────────" -ForegroundColor Gray
    Write-Host "НОВЫЕ ЛОГИ:" -ForegroundColor Yellow
    Write-Host "───────────────────────────────────────" -ForegroundColor Gray
    
    # Проверка новых логов приложения
    $currentAppSize = (Get-Item $logFile -ErrorAction SilentlyContinue).Length
    if ($currentAppSize -and $currentAppSize -gt $lastAppSize) {
        Write-Host "📝 НОВЫЕ ЛОГИ ПРИЛОЖЕНИЯ:" -ForegroundColor Cyan
        $newBytes = $currentAppSize - $lastAppSize
        Get-Content $logFile -Tail 10
        $lastAppSize = $currentAppSize
    }
    
    # Проверка новых ошибок
    $currentErrSize = (Get-Item $errorFile -ErrorAction SilentlyContinue).Length
    if ($currentErrSize -and $currentErrSize -gt $lastErrSize) {
        Write-Host ""
        Write-Host "🔴🔴🔴 НОВЫЕ ОШИБКИ:" -ForegroundColor Red
        Get-Content $errorFile -Tail 20
        $lastErrSize = $currentErrSize
    }
    
    Write-Host ""
    Write-Host "Следующая проверка через 3 секунды..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

