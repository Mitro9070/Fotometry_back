# 🚀 Quick Fix: Получение наблюдений спутника

## ❌ Проблема
```
[INFO] [ObservationsList] No observations with filters found
```

## ✅ Решение

### **Используйте этот URL:**
```javascript
const spacecraftId = '28158'; // NORAD ID спутника

const url = `http://localhost:5000/api/v1/observations?noradId=${spacecraftId}&limit=100`;

const response = await fetch(url);
const data = await response.json();

console.log('Найдено:', data.pagination.total); // 10 наблюдений
```

---

## 📋 Параметры запроса

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `noradId` | ✅ Да | NORAD ID спутника (например, '28158') |
| `limit` | Нет | Количество результатов (по умолчанию 50) |
| `page` | Нет | Номер страницы (по умолчанию 1) |

---

## 🧪 Проверка через консоль браузера

```javascript
// Вставьте в консоль браузера:
fetch('http://localhost:5000/api/v1/observations?noradId=28158&limit=100')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Найдено наблюдений:', data.pagination.total);
    console.log('📊 Данные:', data.data);
  });
```

**Ожидаемый результат:** 10 наблюдений

---

## 🔧 Что изменить в коде

**Найдите строку где делается запрос наблюдений и замените:**

```javascript
// ❌ БЫЛО (неправильно):
const response = await fetch(`/api/v1/satellites/${spacecraftId}/observations`);

// ✅ СТАЛО (правильно):
const response = await fetch(`/api/v1/observations?noradId=${spacecraftId}&limit=100`);
```

**Или если использовался метод без фильтра:**

```javascript
// ❌ БЫЛО (возвращает ВСЕ наблюдения):
const response = await fetch(`/api/v1/observations`);

// ✅ СТАЛО (только для выбранного спутника):
const response = await fetch(`/api/v1/observations?noradId=${spacecraftId}&limit=100`);
```

---

## ✅ Готово!

После этого изменения наблюдения для спутника DSP (NORAD 28158) будут отображаться корректно.

**Всего наблюдений для DSP:** 10 штук
- 3 наблюдения за 22.04.2009
- 7 наблюдений за 30.04.2009

