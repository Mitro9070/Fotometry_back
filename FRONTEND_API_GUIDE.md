# 📘 Руководство по API для Frontend разработчиков

## 🔧 Решение проблемы: "No observations with filters found"

### ❌ Проблема
При выборе спутника на фронте (`spacecraftId: '28158'`) наблюдения не отображаются.

### ✅ Решение
Добавлены параметры фильтрации `noradId` и `satelliteId` в метод получения наблюдений.

---

## 🎯 **ПРАВИЛЬНЫЙ метод для получения наблюдений спутника**

### **Вариант 1: Фильтрация по NORAD ID (рекомендуется для фронта)**

```http
GET /api/v1/observations?noradId={NORAD_ID}
```

**Пример:**
```javascript
// Когда пользователь выбрал спутник с NORAD ID = 28158
const noradId = '28158';

const response = await fetch(
  `http://localhost:5000/api/v1/observations?noradId=${noradId}&limit=100`
);

const data = await response.json();

console.log('Найдено наблюдений:', data.pagination.total); // 10
console.log('Наблюдения:', data.data);
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 69,
      "station": {
        "id": 69,
        "code": "0021",
        "latitudeDeg": 45.543,
        "longitudeDeg": 73.3619,
        "altitudeM": 305
      },
      "obsDate": "2009-04-30",
      "obsNumber": "001210",
      "utcOffsetHours": 6,
      "filters": ["R", "B", "V"],
      "satelliteNumber": "09043026",
      "satelliteId": 41
    }
    // ... еще 9 наблюдений
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 10,
    "pages": 1
  }
}
```

### **Вариант 2: Фильтрация по ID спутника в БД**

```http
GET /api/v1/observations?satelliteId={SATELLITE_ID}
```

**Пример:**
```javascript
// Если у вас есть satelliteId из БД
const satelliteId = 41;

const response = await fetch(
  `http://localhost:5000/api/v1/observations?satelliteId=${satelliteId}&limit=100`
);

const data = await response.json();
```

---

## 📋 **Все параметры фильтрации наблюдений**

```http
GET /api/v1/observations?{параметры}
```

### **Доступные параметры:**

| Параметр | Тип | Описание | Пример |
|----------|-----|----------|---------|
| `noradId` | string | **NORAD ID спутника** | `28158` |
| `satelliteId` | number | ID спутника в БД | `41` |
| `stationCode` | string | Код станции наблюдения | `0021` |
| `dateFrom` | string | Дата начала (YYYY-MM-DD) | `2009-04-22` |
| `dateTo` | string | Дата окончания (YYYY-MM-DD) | `2009-04-30` |
| `obsNumber` | string | Номер наблюдения | `001210` |
| `page` | number | Номер страницы | `1` |
| `limit` | number | Количество на странице (макс 1000) | `50` |
| `sortBy` | string | Поле сортировки | `dateObs` |
| `sortOrder` | string | Порядок сортировки | `asc` или `desc` |

### **Примеры комбинированной фильтрации:**

```javascript
// Все наблюдения спутника за определенный период
fetch('http://localhost:5000/api/v1/observations?noradId=28158&dateFrom=2009-04-22&dateTo=2009-04-30')

// Наблюдения спутника со станции 0021
fetch('http://localhost:5000/api/v1/observations?noradId=28158&stationCode=0021')

// С пагинацией
fetch('http://localhost:5000/api/v1/observations?noradId=28158&page=1&limit=20')
```

---

## 🔄 **Исправление кода на фронте**

### ❌ **Старый код (НЕ работает):**

```javascript
// Неправильно - метод не существует
const observations = await fetch(
  `http://localhost:5000/api/v1/satellites/${spacecraftId}/observations`
);
```

### ✅ **НОВЫЙ код (работает):**

```javascript
// Правильно - используем фильтр noradId
const spacecraftId = '28158'; // NORAD ID выбранного спутника

const response = await fetch(
  `http://localhost:5000/api/v1/observations?noradId=${spacecraftId}&limit=100`
);

const result = await response.json();

if (result.data && result.data.length > 0) {
  console.log(`Найдено ${result.pagination.total} наблюдений`);
  // Обработка наблюдений
  result.data.forEach(obs => {
    console.log(`ID: ${obs.id}, Дата: ${obs.obsDate}, Фильтры: ${obs.filters.join(', ')}`);
  });
} else {
  console.log('Наблюдения не найдены');
}
```

---

## 📊 **Полный workflow для отображения наблюдений спутника**

### **1. Пользователь выбирает спутник**
```javascript
const selectedNoradId = '28158'; // Из списка или поиска
```

### **2. Получаем информацию о спутнике**
```javascript
const satelliteResponse = await fetch(
  `http://localhost:5000/api/v1/satellites/catalog/${selectedNoradId}`
);
const satelliteData = await satelliteResponse.json();

console.log('Спутник:', satelliteData.satellite.name);
console.log('NORAD:', satelliteData.satellite.noradId);
```

### **3. Получаем все наблюдения этого спутника**
```javascript
const observationsResponse = await fetch(
  `http://localhost:5000/api/v1/observations?noradId=${selectedNoradId}&limit=100`
);
const observationsData = await observationsResponse.json();

console.log('Всего наблюдений:', observationsData.pagination.total);
```

### **4. Отображаем список наблюдений**
```javascript
observationsData.data.forEach(observation => {
  console.log({
    id: observation.id,
    date: observation.obsDate,
    station: observation.station.code,
    filters: observation.filters,
    satelliteId: observation.satelliteId
  });
});
```

### **5. Получаем детали конкретного наблюдения**
```javascript
const selectedObsId = observationsData.data[0].id;

const detailsResponse = await fetch(
  `http://localhost:5000/api/v1/observations/${selectedObsId}`
);
const details = await detailsResponse.json();

console.log('Координаты:', details.coordinates.length);
console.log('Фильтры:', details.filters);
```

---

## 🧪 **Тестирование через curl**

### **1. Получить наблюдения по NORAD ID:**
```bash
curl "http://localhost:5000/api/v1/observations?noradId=28158"
```
**Результат:** ✅ 10 наблюдений

### **2. Получить наблюдения по satelliteId:**
```bash
curl "http://localhost:5000/api/v1/observations?satelliteId=41"
```
**Результат:** ✅ 10 наблюдений

### **3. С пагинацией:**
```bash
curl "http://localhost:5000/api/v1/observations?noradId=28158&page=1&limit=5"
```
**Результат:** ✅ 5 наблюдений (первая страница из 2)

### **4. За период:**
```bash
curl "http://localhost:5000/api/v1/observations?noradId=28158&dateFrom=2009-04-30"
```
**Результат:** ✅ 7 наблюдений (только за 30 апреля)

---

## 🔑 **TypeScript интерфейсы для фронта**

```typescript
// Обновленный интерфейс запроса
interface ObservationQueryParams {
  noradId?: string;          // ✅ НОВОЕ - NORAD ID спутника
  satelliteId?: number;      // ✅ НОВОЕ - ID спутника в БД
  stationCode?: string;      // Код станции
  dateFrom?: string;         // Дата начала (YYYY-MM-DD)
  dateTo?: string;           // Дата окончания (YYYY-MM-DD)
  obsNumber?: string;        // Номер наблюдения
  page?: number;             // Номер страницы (по умолчанию 1)
  limit?: number;            // Количество на странице (по умолчанию 50, макс 1000)
  sortBy?: string;           // Поле сортировки
  sortOrder?: 'asc' | 'desc'; // Порядок сортировки
}

// Интерфейс ответа
interface ObservationsListResponse {
  data: Observation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Observation {
  id: number;
  station: {
    id: number;
    code: string;
    latitudeDeg: number;
    longitudeDeg: number;
    altitudeM: number;
  };
  obsDate: string;
  obsNumber: string;
  utcOffsetHours: number;
  filters: string[];
  satelliteNumber: string;
  satelliteId: number;        // ✅ Добавлено
}
```

---

## 🎨 **Пример компонента React/Vue**

### **React пример:**

```typescript
import { useState, useEffect } from 'react';

interface ObservationsListProps {
  spacecraftId: string; // NORAD ID
}

export const ObservationsList: React.FC<ObservationsListProps> = ({ spacecraftId }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchObservations = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/observations?noradId=${spacecraftId}&limit=100`
        );
        const data = await response.json();
        
        setObservations(data.data);
        setTotal(data.pagination.total);
      } catch (error) {
        console.error('Ошибка загрузки наблюдений:', error);
      } finally {
        setLoading(false);
      }
    };

    if (spacecraftId) {
      fetchObservations();
    }
  }, [spacecraftId]);

  if (loading) return <div>Загрузка наблюдений...</div>;
  
  if (total === 0) return <div>Наблюдения не найдены</div>;

  return (
    <div>
      <h3>Найдено наблюдений: {total}</h3>
      <ul>
        {observations.map(obs => (
          <li key={obs.id}>
            ID: {obs.id} | Дата: {obs.obsDate} | Фильтры: {obs.filters.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### **Vue пример:**

```vue
<template>
  <div>
    <div v-if="loading">Загрузка наблюдений...</div>
    <div v-else-if="total === 0">Наблюдения не найдены</div>
    <div v-else>
      <h3>Найдено наблюдений: {{ total }}</h3>
      <ul>
        <li v-for="obs in observations" :key="obs.id">
          ID: {{ obs.id }} | Дата: {{ obs.obsDate }} | 
          Фильтры: {{ obs.filters.join(', ') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  spacecraftId: String // NORAD ID
});

const observations = ref([]);
const loading = ref(false);
const total = ref(0);

const fetchObservations = async () => {
  if (!props.spacecraftId) return;
  
  loading.value = true;
  try {
    const response = await fetch(
      `http://localhost:5000/api/v1/observations?noradId=${props.spacecraftId}&limit=100`
    );
    const data = await response.json();
    
    observations.value = data.data;
    total.value = data.pagination.total;
  } catch (error) {
    console.error('Ошибка загрузки наблюдений:', error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.spacecraftId, fetchObservations, { immediate: true });
</script>
```

---

## 📝 **Что изменить в существующем коде фронта**

### **Найдите место где вызывается API наблюдений:**

```javascript
// ❌ СТАРЫЙ КОД (убрать):
const observations = await fetch(`/api/v1/satellites/${spacecraftId}/observations`);
// или
const observations = await fetch(`/api/v1/observations`); // без фильтров

// ✅ НОВЫЙ КОД (использовать):
const observations = await fetch(
  `/api/v1/observations?noradId=${spacecraftId}&limit=100`
);
```

### **В компоненте списка наблюдений:**

```javascript
// Когда изменяется spacecraftId
useEffect(() => {
  if (spacecraftId) {
    // ✅ Правильный вызов с параметром noradId
    fetchObservations(spacecraftId);
  }
}, [spacecraftId]);

const fetchObservations = async (noradId) => {
  const url = `http://localhost:5000/api/v1/observations?noradId=${noradId}&limit=100`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.pagination.total > 0) {
    setObservations(data.data);
  } else {
    console.log('Наблюдения не найдены для NORAD:', noradId);
    setObservations([]);
  }
};
```

---

## 🧪 **Тестирование для проверки**

### **Тест 1: Проверка наличия наблюдений**
```javascript
const testNoradId = '28158';
const response = await fetch(
  `http://localhost:5000/api/v1/observations?noradId=${testNoradId}`
);
const data = await response.json();

console.log('✅ Тест фильтрации по NORAD ID');
console.log('NORAD ID:', testNoradId);
console.log('Найдено:', data.pagination.total); // Должно быть 10
console.log('Данные:', data.data.length); // Должно быть 10
```

### **Тест 2: Получение детализации наблюдения**
```javascript
const observationId = data.data[0].id;
const detailsResponse = await fetch(
  `http://localhost:5000/api/v1/observations/${observationId}`
);
const details = await detailsResponse.json();

console.log('✅ Детали наблюдения:', observationId);
console.log('Координаты:', details.coordinates.length); // Должно быть 4
console.log('Фильтры:', details.filters.length); // Должно быть 3
console.log('Satellite ID:', details.satelliteId); // Должно быть 41
```

---

## 📊 **Структура данных наблюдения**

```json
{
  "id": 69,
  "station": {
    "id": 69,
    "code": "0021",
    "latitudeDeg": 45.543,
    "longitudeDeg": 73.3619,
    "altitudeM": 305
  },
  "obsDate": "2009-04-30",
  "obsNumber": "001210",
  "utcOffsetHours": 6,
  "filters": ["R", "B", "V"],
  "satelliteNumber": "09043026",
  "satelliteId": 41,
  "coordinates": [
    {
      "hourAngle": 2.2051,
      "deltaDeg": -8.521,
      "timeLocalDecHours": 22
    }
  ],
  "averagingPeriodSec": 30,
  "etalonDurationSec": null,
  "etalonSignal": null
}
```

---

## ⚡ **Quick Fix для фронтенда**

Если у вас есть функция типа `getObservationsBySpacecraft(spacecraftId)`:

```javascript
// ❌ БЫЛО:
async function getObservationsBySpacecraft(spacecraftId) {
  const response = await fetch(`/api/v1/satellites/${spacecraftId}/observations`);
  return response.json();
}

// ✅ СТАЛО:
async function getObservationsBySpacecraft(noradId) {
  const response = await fetch(
    `/api/v1/observations?noradId=${noradId}&limit=100`
  );
  return response.json();
}
```

---

## 🐛 **Debugging checklist**

Если наблюдения не отображаются:

1. ✅ **Проверьте NORAD ID:**
   ```javascript
   console.log('Searching for NORAD ID:', spacecraftId);
   ```

2. ✅ **Проверьте URL запроса:**
   ```javascript
   const url = `http://localhost:5000/api/v1/observations?noradId=${spacecraftId}`;
   console.log('Request URL:', url);
   ```

3. ✅ **Проверьте ответ API:**
   ```javascript
   const data = await response.json();
   console.log('Total observations:', data.pagination.total);
   console.log('Data:', data.data);
   ```

4. ✅ **Проверьте через curl:**
   ```bash
   curl "http://localhost:5000/api/v1/observations?noradId=28158"
   ```

---

## 📚 **Дополнительные методы API**

### **Получить координаты наблюдения:**
```http
GET /api/v1/observations/{id}/coordinates
```

### **Получить фильтры наблюдения:**
```http
GET /api/v1/observations/{id}/filters
```

### **Получить временные ряды для фильтра:**
```http
GET /api/v1/observations/{id}/filters/{code}/series?type=averaged
```

### **Получить спектры фильтра:**
```http
GET /api/v1/observations/{id}/filters/{code}/spectra
```

---

## ✅ **Проверка работы (результаты тестов)**

**Тест выполнен:** `GET /api/v1/observations?noradId=28158`

**Результаты:**
- ✅ Найдено наблюдений: **10**
- ✅ Все имеют satelliteId: **41**
- ✅ Даты: 22.04.2009 и 30.04.2009
- ✅ Станция: 0021
- ✅ Фильтры: B, V, R

**API работает корректно! Проблема была в отсутствии параметра фильтрации на фронте.**

---

## 📞 **Быстрая помощь**

**Проблема:** "No observations with filters found"

**Решение:** Измените API запрос:
```javascript
// Вместо
fetch(`/api/v1/satellites/${id}/observations`)

// Используйте
fetch(`/api/v1/observations?noradId=${id}`)
```

**Swagger документация:** http://localhost:5000/api/docs

Смотрите раздел **"Observations - Наблюдения"** → **GET /api/v1/observations**

