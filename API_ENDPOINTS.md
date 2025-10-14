# Fotometry Backend API - Endpoints

## 📚 Swagger документация
**URL:** http://localhost:5000/api/docs

---

## 🛰️ Satellites - Каталог TLE

### 1. Поиск спутников в каталоге
```
GET /api/v1/satellites/catalog/search?query={название или NORAD ID}
```
**Описание:** Поиск спутников по названию или NORAD номеру (минимум 3 символа)

**Примеры:**
- По названию: `?query=ISS`
- По номеру: `?query=25544`
- По частичному совпадению: `?query=Star` (найдет Starlink)

**Ответ:**
```json
{
  "success": true,
  "total": 8,
  "satellites": [
    {
      "name": "ISS (ZARYA)",
      "noradId": "25544",
      "line1": "1 25544U 98067A...",
      "line2": "2 25544  51.6329...",
      "inclination": 51.6329,
      "raan": 206.2777,
      "eccentricity": 0.0004341,
      ...
    }
  ]
}
```

### 2. Получить детальную информацию по NORAD ID
```
GET /api/v1/satellites/catalog/{noradId}
```
**Описание:** Получить TLE данные и орбитальные параметры из каталога

**Пример:** `/api/v1/satellites/catalog/25544`

---

## 🗄️ Satellites - База данных

### 3. Получить все спутники из БД
```
GET /api/v1/satellites
```
**Описание:** Список спутников, сохраненных в базе данных

### 4. Найти спутник в БД по NORAD ID
```
GET /api/v1/satellites/norad/{noradId}
```
**Описание:** Поиск спутника в базе данных

### 5. Синхронизировать спутник с внешними источниками
```
POST /api/v1/satellites/norad/{noradId}/sync
```
**Описание:** Получить/обновить данные из внешних каталогов (N2YO, Celestrak)

### 6. Получить информацию о спутнике по ID
```
GET /api/v1/satellites/{id}
```
**Описание:** Детальная информация о спутнике из БД

### 7. Рассчитать положение спутника
```
GET /api/v1/satellites/{id}/position?time={ISO время}
```
**Описание:** Расчет положения спутника на орбите

### 8. Рассчитать видимость спутника
```
GET /api/v1/satellites/{id}/visibility?lat={широта}&lon={долгота}&alt={высота}&time={время}
```
**Описание:** Расчет видимости спутника с точки наблюдения

---

## 📥 Ingest - Загрузка данных

### 9. Загрузить файл наблюдения
```
POST /api/v1/ingest/file
```
**Content-Type:** multipart/form-data

**Параметры:**
- `file` - файл наблюдения (.E)
- `satelliteData` - JSON с параметрами спутника из каталога (опционально)
- `position` - JSON с координатами наблюдателя (опционально)
- `source` - источник данных (опционально)

**Пример satelliteData:**
```json
{
  "name": "ISS (ZARYA)",
  "noradId": "25544",
  "line1": "1 25544U 98067A   25261.15495302  .00009099  00000-0  16508-3 0  9995",
  "line2": "2 25544  51.6329 206.2777 0004341 352.6018   7.4906 15.50367586529587"
}
```

### 10. Загрузить данные в JSON формате
```
POST /api/v1/ingest/json
```

### 11. Получить полную проводку по номеру КА
```
GET /api/v1/ingest/satellite/{satelliteNumber}?date={дата}
```

### 12. Получить партиции наблюдения
```
GET /api/v1/ingest/satellite/{satelliteNumber}/partitions?date={дата}
```

### 13. Получить список всех КА
```
GET /api/v1/ingest/satellites
```

---

## 🔭 Observations - Наблюдения

### 14. Получить список наблюдений
```
GET /api/v1/observations?page={1}&limit={10}&pointCode={код}&dateFrom={дата}&dateTo={дата}
```

### 15. Получить наблюдение по ID
```
GET /api/v1/observations/{id}
```

### 16. Удалить наблюдение
```
DELETE /api/v1/observations/{id}
```

### 17. Получить координаты наблюдения
```
GET /api/v1/observations/{id}/coordinates
```

### 18. Получить фильтры наблюдения
```
GET /api/v1/observations/{id}/filters
```

### 19. Получить детали по фильтру
```
GET /api/v1/observations/{id}/filters/{code}
```

### 20. Получить временные ряды
```
GET /api/v1/observations/{id}/filters/{code}/series?type={raw|instrumental|averaged}
```

### 21. Получить спектральные пики
```
GET /api/v1/observations/{id}/filters/{code}/spectra
```

---

## 📊 Analytics - Аналитика

### 22. Распределение по фильтрам
```
GET /api/v1/analytics/filters
```

### 23. Спектральные пики
```
GET /api/v1/analytics/spectra?filterCode={код}
```

### 24. Сводная статистика
```
GET /api/v1/analytics/stats
```

### 25. Статистика звездных величин
```
GET /api/v1/analytics/magnitudes?filterCode={код}
```

---

## 🔄 Workflow для фронтенда

### Добавление нового наблюдения:

1. **Поиск спутника в каталоге:**
   ```
   GET /api/v1/satellites/catalog/search?query=ISS
   ```

2. **Получение TLE данных:**
   ```
   GET /api/v1/satellites/catalog/25544
   ```

3. **Загрузка файла наблюдения:**
   ```
   POST /api/v1/ingest/file
   ```
   - Прикрепить файл
   - Передать satelliteData из шага 2
   - Передать position с координатами наблюдателя

4. **Результат:**
   - Спутник создан/обновлен в БД
   - Наблюдение сохранено и связано со спутником
   - Вычислены орбитальные параметры

---

## 🔍 Примеры запросов

### Поиск МКС и получение данных:
```bash
# Шаг 1: Поиск
curl "http://localhost:5000/api/v1/satellites/catalog/search?query=ISS"

# Шаг 2: Получение TLE
curl "http://localhost:5000/api/v1/satellites/catalog/25544"

# Шаг 3: Загрузка наблюдения
curl -X POST "http://localhost:5000/api/v1/ingest/file" \
  -F "file=@observation.E" \
  -F 'satelliteData={"name":"ISS (ZARYA)","noradId":"25544","line1":"...","line2":"..."}' \
  -F 'position={"lat":55.75,"lon":37.62,"alt":0}' \
  -F 'source=Ground Station 1'
```

### Поиск Starlink спутников:
```bash
curl "http://localhost:5000/api/v1/satellites/catalog/search?query=Starlink"
# Вернет 8000+ результатов
```

### Расчет положения МКС:
```bash
curl "http://localhost:5000/api/v1/satellites/1/position"
```

---

## ✅ Статус

- ✅ Порт: **5000**
- ✅ Swagger: http://localhost:5000/api/docs
- ✅ База данных: PostgreSQL (45.12.73.86:5432)
- ✅ Каталог TLE: catsat18092025.txt (**загружен**)
- ✅ Все endpoints протестированы и работают

