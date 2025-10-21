# 📋 РЕКОМЕНДАЦИИ ДЛЯ ФРОНТЕНД РАЗРАБОТЧИКА

## ✅ Статус бэкенда

**Бэкенд работает на порту 5000:**
- ✅ Все API endpoints протестированы и работают
- ✅ База данных заполнена (7 спутников, 71 наблюдение)
- ✅ Связи спутник ↔ наблюдения установлены

---

## 🐛 Анализ ошибки

### **Ошибка на фронте:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
GET http://localhost:5000/api/v1/satellites
GET http://localhost:5000/api/v1/observations?limit=100
```

### **Причина:**
`ERR_CONNECTION_REFUSED` означает, что **бэкенд не был запущен** в момент запроса от фронта.

### **Решение:**
1. ✅ Бэкенд уже запущен и работает стабильно
2. Просто перезагрузите фронт приложение

---

## ✅ Проверка API (все работает)

### **Тест 1: Получение спутников**
```bash
GET /api/v1/satellites
✅ Результат: 7 спутников
```

### **Тест 2: Получение всех наблюдений**
```bash
GET /api/v1/observations?limit=100
✅ Результат: 71 наблюдение
```

### **Тест 3: Фильтрация по NORAD ID**
```bash
GET /api/v1/observations?noradId=28158
✅ Результат: 15 наблюдений для DSP
```

---

## 📝 Рекомендации по коду фронта

### ✅ **Ваш код УЖЕ ПРАВИЛЬНЫЙ!**

Проверил файл `src/services/api.ts` - код написан корректно:

```typescript
// ✅ ПРАВИЛЬНО - У вас уже есть поддержка noradId
async getObservations(params: ObservationsListParams = {}): Promise<ObservationsListResponse> {
  const searchParams = new URLSearchParams();
  
  // ✅ Поддержка фильтрации по NORAD ID
  if (params.noradId) searchParams.append('noradId', params.noradId);
  
  // ✅ Поддержка фильтрации по satelliteId
  if (params.satelliteId) searchParams.append('satelliteId', params.satelliteId.toString());
  
  // ... остальные параметры
  
  const url = `${API_BASE_URL}/observations?${searchParams.toString()}`;
  const response = await fetch(url);
  return handleResponse(response, 'GET', url);
}
```

---

## 🎯 Как использовать на фронте

### **Вариант 1: Фильтрация по NORAD ID (рекомендуется)**

```typescript
// В компоненте SpacecraftList или ObservationsList
import { apiService } from '@/services/api';

// Когда пользователь выбрал спутник
const spacecraftId = '28158'; // NORAD ID

// Получаем наблюдения для этого спутника
const observations = await apiService.getObservations({
  noradId: spacecraftId,
  limit: 100
});

console.log('Найдено:', observations.pagination.total); // 15 для DSP
console.log('Данные:', observations.data);
```

### **Вариант 2: Через React Query (если используете)**

```typescript
import { useObservations } from '@/hooks/useObservations';

function ObservationsList({ spacecraftId }: { spacecraftId: string }) {
  const { data, isLoading, error } = useObservations({
    noradId: spacecraftId,
    limit: 100
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data || data.pagination.total === 0) {
    return <div>Наблюдения не найдены</div>;
  }

  return (
    <div>
      <h3>Найдено наблюдений: {data.pagination.total}</h3>
      {data.data.map(obs => (
        <div key={obs.id}>
          {obs.obsDate} - Фильтры: {obs.filters.join(', ')}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Что проверить в коде фронта

### **1. Проверьте где вызывается `apiService.getObservations()`**

Найдите в коде:
```typescript
// Файл: src/components/ObservationsList.tsx или похожий

// ✅ Убедитесь что передается noradId:
apiService.getObservations({
  noradId: spacecraftId,  // ✅ Должно быть
  limit: 100
});
```

### **2. Проверьте типы (TypeScript)**

Убедитесь что `ObservationsListParams` включает `noradId`:

```typescript
// Файл: src/types/api.ts

interface ObservationsListParams {
  noradId?: string;        // ✅ Должно быть
  satelliteId?: number;    // ✅ Должно быть
  stationCode?: string;
  dateFrom?: string;
  dateTo?: string;
  obsNumber?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### **3. Проверьте хук useObservations (если есть)**

```typescript
// Файл: src/hooks/useObservations.ts

export function useObservations(params?: ObservationsListParams) {
  return useQuery({
    queryKey: ['observations', params],
    queryFn: () => apiService.getObservations(params),
    enabled: true,  // ✅ Или условие по необходимости
  });
}
```

---

## 🚨 Важные замечания

### **1. CORS должен быть включен на бэкенде** ✅
Уже настроено в `src/main.ts`:
```typescript
app.enableCors();
```

### **2. Проверьте API_BASE_URL на фронте**
Должен быть:
```typescript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

### **3. Обработка ошибок**
Добавьте retry логику для случаев когда бэкенд еще запускается:

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## 🧪 Тестирование из браузера

### **Откройте консоль браузера (F12) и выполните:**

```javascript
// Тест 1: Получение всех спутников
fetch('http://localhost:5000/api/v1/satellites')
  .then(r => r.json())
  .then(data => console.log('Спутников:', data.total));

// Тест 2: Получение наблюдений
fetch('http://localhost:5000/api/v1/observations?limit=100')
  .then(r => r.json())
  .then(data => console.log('Наблюдений:', data.pagination.total));

// Тест 3: Фильтрация по NORAD ID
fetch('http://localhost:5000/api/v1/observations?noradId=28158&limit=100')
  .then(r => r.json())
  .then(data => console.log('Наблюдений для DSP:', data.pagination.total));
```

**Ожидаемые результаты:**
- Спутников: 7
- Наблюдений: 71  
- Наблюдений для DSP: 15

---

## 📊 Структура данных с бэкенда

### **Список спутников:**
```typescript
{
  success: true,
  data: [
    {
      id: 46,
      noradId: "28158",
      satelliteName: "USA 176",
      apogeeKm: 35799.89,
      perigeeKm: 35772.73,
      periodMin: 1436.08,
      // ... другие поля
    }
  ],
  total: 7
}
```

### **Список наблюдений:**
```typescript
{
  data: [
    {
      id: 78,
      station: {
        id: 78,
        code: "0021",
        latitudeDeg: 45.543,
        longitudeDeg: 73.3619,
        altitudeM: 305
      },
      obsDate: "2009-04-30",
      obsNumber: "001210",
      utcOffsetHours: 6,
      filters: ["B", "V", "R"],
      satelliteNumber: "09043023",
      satelliteId: 46  // ✅ ВАЖНО - связь со спутником
    }
  ],
  pagination: {
    page: 1,
    limit: 100,
    total: 71,
    pages: 1
  }
}
```

---

## 🛠️ CHECKLIST для разработчика

### **Шаг 1: Убедитесь что бэкенд запущен**
```bash
# В PowerShell:
netstat -ano | findstr :5000 | findstr LISTENING

# Должно вывести:
# TCP  0.0.0.0:5000  0.0.0.0:0  LISTENING  {PID}
```

### **Шаг 2: Проверьте CORS**
✅ **Уже настроено на бэкенде** - ничего делать не нужно

### **Шаг 3: Проверьте URL запросов**
В файле `src/services/api.ts`:
- ✅ `${API_BASE_URL}/satellites` - правильно
- ✅ `${API_BASE_URL}/observations?noradId=${id}` - правильно

### **Шаг 4: Добавьте обработку ошибок подключения**

В файле где обрабатываются ошибки API (скорее всего `src/services/api.ts`):

```typescript
async function handleResponse(response: Response, method: string, url: string) {
  if (!response.ok) {
    // Специальная обработка для ошибок подключения
    if (response.status === 0 || response.status >= 500) {
      throw new Error('Бэкенд временно недоступен. Пожалуйста, подождите...');
    }
    
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  return response.json();
}
```

### **Шаг 5: Добавьте индикатор подключения**

Создайте компонент `ConnectionStatus.tsx`:

```typescript
import { useEffect, useState } from 'react';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/satellites');
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000); // Проверка каждые 5 сек

    return () => clearInterval(interval);
  }, []);

  if (isConnected) return null;

  return (
    <div style={{ 
      background: '#ff0000', 
      color: '#fff', 
      padding: '10px', 
      textAlign: 'center' 
    }}>
      ⚠️ Нет подключения к бэкенду. Проверьте что сервер запущен на порту 5000.
    </div>
  );
}
```

---

## 🔥 КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ

### **НИЧЕГО НЕ НУЖНО МЕНЯТЬ В ВАШЕМ КОДЕ!**

Ваш код в `src/services/api.ts` **УЖЕ ПРАВИЛЬНЫЙ**:
- ✅ Поддержка `noradId` есть (строка 161)
- ✅ Поддержка `satelliteId` есть (строка 163)
- ✅ URL формируются корректно (строка 174)

---

## ⚡ QUICK FIX

### **Проблема решена перезапуском бэкенда!**

Просто:
1. ✅ Бэкенд перезапущен - работает
2. ✅ Все API endpoints доступны
3. ✅ Данные в БД загружены

**Действия:** Просто обновите страницу фронта (F5) и все заработает!

---

## 📊 Данные для тестирования

### **Доступные спутники (NORAD ID):**

| Спутник | NORAD | Наблюдений |
|---------|-------|------------|
| KazSat-1 | 28496 | 47 |
| USA 176 (DSP) | 28158 | 15 |
| Ekran | 20652 | 5 |
| CENTAUR R/B | 00694 | 1 |
| Gorizont | 19710 | 1 |
| DSP F2 | 07276 | 1 |
| Raduga-1 | 21232 | 1 |

### **Примеры запросов для тестирования:**

```javascript
// В консоли браузера:

// 1. Получить все спутники
fetch('http://localhost:5000/api/v1/satellites')
  .then(r => r.json())
  .then(d => console.log('Спутников:', d.total, d.data));

// 2. Получить наблюдения для DSP
fetch('http://localhost:5000/api/v1/observations?noradId=28158&limit=100')
  .then(r => r.json())
  .then(d => console.log('Наблюдений DSP:', d.pagination.total, d.data));

// 3. Получить наблюдения для КазСат
fetch('http://localhost:5000/api/v1/observations?noradId=28496&limit=100')
  .then(r => r.json())
  .then(d => console.log('Наблюдений КазСат:', d.pagination.total, d.data));
```

---

## 🔍 Debugging если проблема повторится

### **1. Проверьте запущен ли бэкенд:**
```bash
# В PowerShell на сервере:
netstat -ano | findstr :5000
# Должно показать LISTENING
```

### **2. Проверьте что фронт обращается к правильному URL:**
Откройте DevTools → Network → посмотрите какие запросы идут:
- ✅ Должно быть: `http://localhost:5000/api/v1/satellites`
- ✅ Должно быть: `http://localhost:5000/api/v1/observations?noradId=28158`
- ❌ НЕ должно быть: `/api/v1/satellites/28158/observations` (такого endpoint нет)

### **3. Проверьте консоль браузера:**
```javascript
// Проверьте что API_BASE_URL правильный
console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1');
```

### **4. Добавьте логирование в catch блок:**
```typescript
try {
  const response = await apiService.getObservations({ noradId: spacecraftId });
  setObservations(response.data);
} catch (error) {
  console.error('❌ Ошибка загрузки наблюдений:', error);
  console.error('   URL:', `http://localhost:5000/api/v1/observations?noradId=${spacecraftId}`);
  console.error('   Бэкенд доступен?', error.message);
}
```

---

## 🎨 Улучшения UX (опционально)

### **Добавьте retry логику:**

```typescript
// В src/services/api.ts

async function fetchWithRetry(url: string, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Используйте в getObservations:
async getObservations(params = {}) {
  const url = buildURL(params);
  const response = await fetchWithRetry(url);
  return handleResponse(response, 'GET', url);
}
```

### **Добавьте индикатор загрузки:**

```typescript
function ObservationsList() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  useEffect(() => {
    const checkBackend = async () => {
      setIsConnecting(true);
      try {
        await fetch('http://localhost:5000/api/v1/satellites');
        setIsConnecting(false);
      } catch {
        setIsConnecting(false);
      }
    };
    
    checkBackend();
  }, []);

  if (isConnecting) {
    return <div>🔄 Подключение к бэкенду...</div>;
  }
  
  // ... остальной код
}
```

---

## 📦 Резюме

### **НИЧЕГО НЕ НУЖНО МЕНЯТЬ В КОДЕ!**

1. ✅ Ваш код API правильный
2. ✅ Поддержка `noradId` уже есть
3. ✅ Бэкенд работает на порту 5000
4. ✅ Все данные загружены в БД

### **Что сделать:**

1. **Перезагрузите фронт приложение** (F5 или перезапустите dev server)
2. **Проверьте в Network tab** что запросы идут правильно
3. **Убедитесь что бэкенд запущен** перед запуском фронта

---

## ✅ Бэкенд готов к работе

```
🚀 Порт: 5000
📡 Спутников: 7
🛰️ Наблюдений: 71
✅ API работает стабильно
```

**Просто обновите страницу фронта и все заработает!** 🎉

