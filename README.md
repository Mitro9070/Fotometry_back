# Fotometry Backend

Backend-сервис для системы сбора, хранения и обработки фотометрической информации об ИСЗ (искусственных спутниках Земли).

## Описание

Система предназначена для загрузки, хранения и обработки данных наблюдений за ИСЗ. Фронтенд передаёт на сервер текстовые файлы в заданном формате. Бэкенд:

- Принимает файлы
- Парсит их содержимое
- Сохраняет данные в реляционной базе данных (PostgreSQL)
- Предоставляет API для просмотра и обработки данных

## Технологический стек

- **Node.js** с **NestJS** фреймворком
- **PostgreSQL** - реляционная база данных
- **TypeORM** - ORM для работы с базой данных
- **Docker** - контейнеризация
- **Swagger** - документация API

## Структура проекта

```
src/
├── config/                 # Конфигурация приложения
├── entities/              # Сущности базы данных
├── modules/               # Модули приложения
│   ├── ingest/           # Модуль загрузки данных
│   ├── observations/     # Модуль работы с наблюдениями
│   └── analytics/        # Модуль аналитики
├── main.ts               # Точка входа приложения
└── app.module.ts         # Главный модуль
```

## API Endpoints

### Ingest (Загрузка данных)
- `POST /api/v1/ingest/file` - Загрузка текстового файла
- `POST /api/v1/ingest/json` - Прямой прием JSON данных

### Observations (Наблюдения)
- `GET /api/v1/observations` - Список наблюдений с фильтрацией
- `GET /api/v1/observations/:id` - Детальная информация о наблюдении
- `DELETE /api/v1/observations/:id` - Удаление наблюдения
- `GET /api/v1/observations/:id/coordinates` - Координаты наблюдения
- `GET /api/v1/observations/:id/filters` - Список фильтров
- `GET /api/v1/observations/:id/filters/:code` - Информация о фильтре
- `GET /api/v1/observations/:id/filters/:code/series` - Временные ряды
- `GET /api/v1/observations/:id/filters/:code/spectra` - Спектральные пики

### Analytics (Аналитика)
- `GET /api/v1/analytics/filters` - Распределение по фильтрам
- `GET /api/v1/analytics/spectra` - Пики в спектрах
- `GET /api/v1/analytics/stats` - Общая статистика
- `GET /api/v1/analytics/magnitudes` - Статистика звездных величин

## Установка и запуск

### Предварительные требования

- Node.js 18+
- PostgreSQL 15+
- Docker и Docker Compose (опционально)

### Локальная установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd fotometry-backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `env.example`:
```bash
cp env.example .env
```

4. Настройте переменные окружения в `.env`:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=fotometry
```

5. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE fotometry;
```

6. Запустите миграции (если есть):
```bash
npm run migration:run
```

7. Запустите приложение:
```bash
# Режим разработки
npm run start:dev

# Продакшн режим
npm run build
npm run start:prod
```

### Запуск с Docker

1. Убедитесь, что Docker и Docker Compose установлены

2. Запустите приложение:
```bash
docker-compose up -d
```

3. Приложение будет доступно по адресу: http://localhost:3000

4. Swagger документация: http://localhost:3000/api/docs

## Структура базы данных

### Основные таблицы:
- `stations` - Станции наблюдений
- `observations` - Наблюдения
- `coordinates` - Координаты
- `filters` - Фильтры
- `series_signal` - Временные ряды сигналов
- `series_magnitude` - Временные ряды звездных величин
- `magnitude_avg` - Усредненные величины
- `spectra_peaks` - Спектральные пики

## Формат входных данных

### Текстовый файл
Файл должен содержать следующие блоки:
- `ПУНКТ` - информация о станции наблюдения
- `ДАТА / НОМЕР` - дата и номер наблюдения
- `КООРДИНАТЫ` - координаты наблюдения
- `Фильтр` - блоки с данными по фильтрам (B, V, R)

### JSON формат
```json
{
  "station": {
    "code": "0021",
    "latitudeDeg": 45.5359,
    "longitudeDeg": 73.3601,
    "altitudeM": 306.0
  },
  "observation": {
    "obsDate": "2006-09-25",
    "obsNumber": "000216",
    "utcOffsetHours": 6
  },
  "coordinates": [...],
  "filters": [...]
}
```

## Разработка

### Команды для разработки

```bash
# Запуск в режиме разработки
npm run start:dev

# Сборка проекта
npm run build

# Запуск тестов
npm run test

# Линтинг кода
npm run lint

# Форматирование кода
npm run format
```

### Генерация миграций

```bash
# Создание миграции
npm run migration:generate -- src/migrations/MigrationName

# Запуск миграций
npm run migration:run

# Откат миграции
npm run migration:revert
```

## Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие кода тестами
npm run test:cov
```

## Документация API

После запуска приложения документация Swagger доступна по адресу:
http://localhost:3000/api/docs

## Лицензия

MIT

