# Скрипт для запуска Swagger без базы данных (для тестирования API)

Write-Host "🚀 Запуск Fotometry Backend для тестирования Swagger..." -ForegroundColor Green

# Проверяем наличие .env файла
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Файл .env не найден. Создаем из примера..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Файл .env создан." -ForegroundColor Green
}

# Устанавливаем зависимости если нужно
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Blue
    npm install
}

# Создаем папку для загрузок
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
}

Write-Host "🔧 Запуск приложения в режиме разработки..." -ForegroundColor Green
Write-Host "📚 Swagger будет доступен по адресу: http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host "⚠️  Примечание: База данных не настроена, некоторые endpoints могут не работать" -ForegroundColor Yellow

npm run start:dev

