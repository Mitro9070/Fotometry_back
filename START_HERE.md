# ⚡ БЫСТРЫЙ СТАРТ

## 🎯 ПРОБЛЕМА РЕШЕНА!

**Бэкенд падал потому что фронтенд убивал ВСЕ процессы Node.js!**

---

## ✅ КАК ПРАВИЛЬНО ЗАПУСКАТЬ:

### Шаг 1: Запустить БЭКЕНД (в отдельном окне PowerShell)

```powershell
cd C:\FotometryFactory\New-app\Back_29.08
npm run start:dev
```

**ОСТАВЬТЕ ЭТО ОКНО ОТКРЫТЫМ!**

### Шаг 2: Запустить ФРОНТЕНД (в другом окне PowerShell)

**ВАРИАНТ А: Безопасный скрипт (РЕКОМЕНДУЕТСЯ)**
```powershell
cd C:\FotometryFactory\New-app\front_app
.\start-frontend-safe.ps1
```

**ВАРИАНТ Б: Обычный запуск**
```powershell
cd C:\FotometryFactory\New-app\front_app
npm run dev
```

**⚠️ НЕ ИСПОЛЬЗУЙТЕ команды типа:**
- `Get-Process -Name node | Stop-Process -Force` ❌
- `taskkill /F /IM node.exe` ❌

Они убивают ВСЕ процессы node, включая бэкенд!

---

## 🔍 ПРОВЕРКА

### Быстрая проверка что всё работает:

```powershell
# Проверка портов
netstat -ano | Select-String ":5000|:3000" | Select-String "LISTENING"

# Проверка API
curl http://localhost:5000/api/v1/satellites
```

**Должно быть:**
- ✅ Порт 5000 слушается (бэкенд)
- ✅ Порт 3000 слушается (фронтенд)
- ✅ API возвращает JSON

---

## 📚 ДОКУМЕНТАЦИЯ

- **Полная инструкция:** `FRONTEND_START_INSTRUCTIONS.md`
- **API документация:** http://localhost:5000/api/docs
- **Frontend API Guide:** `FRONTEND_API_GUIDE.md`

---

## 🆘 ЕСЛИ ЧТО-ТО СЛОМАЛОСЬ

1. **Остановите фронтенд** (Ctrl+C в его окне)
2. **Проверьте что бэкенд ещё работает:**
   ```powershell
   netstat -ano | Select-String ":5000" | Select-String "LISTENING"
   ```
3. **Если бэкенд тоже упал - перезапустите его** (Шаг 1 выше)
4. **Запустите фронтенд заново** (Шаг 2 выше)

---

## 🎯 ТЕКУЩИЙ СТАТУС

✅ **Бэкенд запущен** на порту 5000  
✅ **API работает** (7 спутников в БД, 133 наблюдения)  
✅ **Логирование настроено**  
✅ **Скрипт безопасного запуска создан**  

**Просто используйте безопасный скрипт и всё будет работать!** 🚀

