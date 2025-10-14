# Быстрый старт - Fotometry Backend

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
Создайте файл `.env` на основе `env.example`:
```bash
cp env.example .env
```

### 3. Настройка базы данных
Убедитесь, что PostgreSQL запущен и создайте базу данных:
```sql
CREATE DATABASE fotometry;
```

### 4. Запуск приложения

#### Режим разработки:
```bash
npm run start:dev
```

#### Продакшн режим:
```bash
npm run build
npm run start:prod
```

#### С Docker:
```bash
docker-compose up -d
```

### 5. Проверка работы
- Приложение: http://localhost:3000
- Swagger документация: http://localhost:3000/api/docs

## 📋 Доступные команды

```bash
# Разработка
npm run start:dev      # Запуск в режиме разработки
npm run start:debug    # Запуск с отладкой
npm run build          # Сборка проекта

# Тестирование
npm test               # Запуск unit тестов
npm run test:e2e       # Запуск e2e тестов
npm run test:cov       # Покрытие кода тестами

# Линтинг и форматирование
npm run lint           # Проверка кода
npm run format         # Форматирование кода

# Миграции базы данных
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

## 🔧 Основные API endpoints

### Загрузка данных
- `POST /api/v1/ingest/file` - Загрузка текстового файла
- `POST /api/v1/ingest/json` - Прямой прием JSON данных

### Наблюдения
- `GET /api/v1/observations` - Список наблюдений
- `GET /api/v1/observations/:id` - Детали наблюдения
- `DELETE /api/v1/observations/:id` - Удаление наблюдения

### Аналитика
- `GET /api/v1/analytics/filters` - Статистика по фильтрам
- `GET /api/v1/analytics/stats` - Общая статистика

## 📁 Структура проекта

```
src/
├── config/                 # Конфигурация
├── entities/              # Сущности БД
├── modules/               # Модули приложения
│   ├── ingest/           # Загрузка данных
│   ├── observations/     # Работа с наблюдениями
│   └── analytics/        # Аналитика
├── main.ts               # Точка входа
└── app.module.ts         # Главный модуль
```

## 🐛 Устранение проблем

### Ошибка подключения к БД
- Убедитесь, что PostgreSQL запущен
- Проверьте настройки в `.env`
- Создайте базу данных `fotometry`

### Ошибки сборки
```bash
npm run build
```

### Проблемы с зависимостями
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в корректности настроек `.env`
3. Проверьте подключение к базе данных

