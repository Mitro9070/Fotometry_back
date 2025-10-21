# 🚀 ИНСТРУКЦИЯ ПО ЗАПУСКУ ФРОНТЕНДА

## ⚠️ КРИТИЧЕСКИ ВАЖНО!

**НЕ УБИВАЙТЕ ВСЕ ПРОЦЕССЫ NODE.JS!**

Если вы убиваете все процессы node командами:
```powershell
Get-Process -Name node | Stop-Process -Force
taskkill /F /IM node.exe
```

Вы также убиваете **БЭКЕНД**, который тоже работает на Node.js!

---

## ✅ ПРАВИЛЬНЫЙ ПОРЯДОК ЗАПУСКА

### 1. Запуск бэкенда (один раз)

Откройте **отдельное окно PowerShell** и выполните:

```powershell
cd C:\FotometryFactory\New-app\Back_29.08
npm run start:dev
```

**Оставьте это окно открытым!** Бэкенд должен работать постоянно.

Вы увидите:
```
🚀 Приложение запущено на порту 5000
📚 Swagger документация доступна по адресу: http://localhost:5000/api/docs
```

### 2. Проверка что бэкенд работает

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/satellites" -UseBasicParsing
```

Должен вернуть статус **200 OK**.

### 3. Запуск фронтенда

В **другом окне PowerShell**:

```powershell
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

**ВАЖНО:** НЕ УБИВАЙТЕ процессы node перед запуском!

---

## 🔄 ПЕРЕЗАПУСК ФРОНТЕНДА (если нужно)

Если нужно перезапустить ТОЛЬКО фронтенд:

### Вариант 1: По порту (РЕКОМЕНДУЕТСЯ)

```powershell
# Найти PID процесса на порту 3000
$pid = (netstat -ano | Select-String ":3000" | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)

# Убить только этот процесс
if ($pid) { Stop-Process -Id $pid -Force }

# Запустить фронтенд
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

### Вариант 2: По имени пакета

Если у вашего фронтенда есть уникальное имя пакета, можно фильтровать процессы по нему.

---

## 🛑 ЧТО ДЕЛАТЬ ЕСЛИ СЛУЧАЙНО УБИЛИ ВСЁ

Если случайно убили все процессы node:

### 1. Перезапустите бэкенд

```powershell
cd C:\FotometryFactory\New-app\Back_29.08
npm run start:dev
```

Подождите **15-20 секунд** пока бэкенд полностью запустится.

### 2. Проверьте что порт 5000 слушается

```powershell
netstat -ano | Select-String ":5000" | Select-String "LISTENING"
```

Должна быть строка вида:
```
TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345
```

### 3. Проверьте API

```powershell
curl http://localhost:5000/api/v1/satellites
```

Должен вернуть JSON с массивом спутников.

### 4. Запустите фронтенд

```powershell
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

---

## 🎯 API ENDPOINTS БЭКЕНДА

Фронтенд должен обращаться к:
```
http://localhost:5000/api/v1/satellites
http://localhost:5000/api/v1/observations
http://localhost:5000/api/v1/satellites/catalog/search?query=DSP
```

### Проверка доступности API:

```powershell
# Проверка satellites
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/satellites" -UseBasicParsing

# Проверка observations  
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/observations?limit=5" -UseBasicParsing

# Проверка catalog search
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/satellites/catalog/search?query=DSP" -UseBasicParsing
```

---

## 🔍 ОТЛАДКА

### Если фронтенд показывает ERR_CONNECTION_REFUSED:

1. **Проверьте что бэкенд запущен:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Format-Table Id, ProcessName, StartTime
   ```
   
   Должно быть минимум 2 процесса:
   - Один для бэкенда
   - Один для фронтенда

2. **Проверьте порт 5000:**
   ```powershell
   netstat -ano | Select-String ":5000" | Select-String "LISTENING"
   ```

3. **Проверьте логи бэкенда:**
   ```powershell
   Get-Content "C:\FotometryFactory\New-app\Back_29.08\logs\application-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 20
   ```

4. **Тест API напрямую:**
   ```powershell
   curl http://localhost:5000/api/v1/satellites
   ```

### Если API не отвечает:

1. Перейдите в окно где запущен бэкенд
2. Посмотрите есть ли ошибки в консоли
3. Если процесс умер - перезапустите

---

## ⚡ БЫСТРЫЙ СТАРТ (Copy-Paste)

### Окно 1 (Бэкенд - оставить открытым):
```powershell
cd C:\FotometryFactory\New-app\Back_29.08
npm run start:dev
```

### Окно 2 (Фронтенд):
```powershell
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

### Проверка:
```powershell
# Проверка портов
netstat -ano | Select-String ":5000|:3000" | Select-String "LISTENING"

# Должно быть:
# :5000 - бэкенд
# :3000 - фронтенд
```

---

## 📞 КОНТАКТЫ И ПОДДЕРЖКА

- **Swagger документация:** http://localhost:5000/api/docs
- **Логи бэкенда:** `C:\FotometryFactory\New-app\Back_29.08\logs\`
- **Логи ошибок:** `C:\FotometryFactory\New-app\Back_29.08\logs\error-YYYY-MM-DD.log`

---

## 🎨 РАЗРАБОТКА

Во время разработки фронтенда:
- **Бэкенд** запустите один раз и не трогайте
- **Фронтенд** перезапускайте как угодно часто
- **НЕ ИСПОЛЬЗУЙТЕ** команды которые убивают ВСЕ процессы node

### Для перезапуска ТОЛЬКО фронтенда:

```powershell
# Остановить процесс на порту 3000
$frontendPid = (netstat -ano | Select-String ":3000" | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($frontendPid) { 
    Stop-Process -Id $frontendPid -Force 
    Write-Host "✅ Фронтенд остановлен (PID: $frontendPid)"
}

Start-Sleep -Seconds 2

# Запустить заново
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

---

## 🚨 ТИПИЧНЫЕ ОШИБКИ

### ❌ НЕПРАВИЛЬНО:
```powershell
# ЭТО УБЬЕТ И БЭКЕНД!
Get-Process -Name node | Stop-Process -Force
taskkill /F /IM node.exe
```

### ✅ ПРАВИЛЬНО:
```powershell
# Убить только процесс на порту 3000 (фронтенд)
$frontendPid = (netstat -ano | Select-String ":3000" | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
if ($frontendPid) { Stop-Process -Id $frontendPid -Force }
```

---

## 📊 МОНИТОРИНГ

Для проверки состояния системы в реальном времени:

```powershell
cd C:\FotometryFactory\New-app\Back_29.08
.\scripts\monitor-backend.ps1
```

Этот скрипт покажет:
- Процессы node
- Статус портов
- Работу API
- Новые ошибки в режиме реального времени

---

**Следуйте этой инструкции и проблем не будет! 🚀**

