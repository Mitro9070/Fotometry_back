# Скрипт для запуска приложения в режиме разработки (Windows)

Write-Host "🚀 Запуск Fotometry Backend в режиме разработки..." -ForegroundColor Green

# Проверяем наличие .env файла
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Файл .env не найден. Создаем из примера..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Файл .env создан. Отредактируйте его при необходимости." -ForegroundColor Green
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

Write-Host "🔧 Запуск приложения..." -ForegroundColor Green
npm run start:dev

