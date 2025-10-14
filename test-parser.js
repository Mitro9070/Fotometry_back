const fs = require('fs');
const iconv = require('iconv-lite');

// Читаем файл
const buffer = fs.readFileSync('test-data/вторая проводка/09043025.13E');
const content = iconv.decode(buffer, 'cp866');
const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log('=== АНАЛИЗ ФАЙЛА ===');
console.log('Количество строк:', lines.length);
console.log('Первые 20 строк:');
lines.slice(0, 20).forEach((line, index) => {
  console.log(`${index}: "${line}"`);
});

console.log('\n=== ПОИСК ФИЛЬТРОВ ===');
lines.forEach((line, index) => {
  if (line.includes("'B'") || line.includes("'V'") || line.includes("'R'")) {
    console.log(`Строка ${index}: "${line}"`);
  }
});

console.log('\n=== ПОИСК ЭТАЛОНА ===');
lines.forEach((line, index) => {
  if (line.includes('Э') && line.includes('Т') && line.includes('А') && line.includes('Л') && line.includes('О') && line.includes('Н')) {
    console.log(`Строка ${index}: "${line}"`);
  }
});

console.log('\n=== ПОИСК ПАРАМЕТРОВ ФИЛЬТРОВ ===');
lines.forEach((line, index) => {
  if (line.includes('Фильтр') || line.includes('Начало') || line.includes('Интерв')) {
    console.log(`Строка ${index}: "${line}"`);
  }
});

console.log('\n=== ПОИСК ЗВЕЗДНЫХ ВЕЛИЧИН ===');
lines.forEach((line, index) => {
  if (line.includes('ИНСТРУМЕНТАЛЬНАЯ') || line.includes('ЗВЕЗДНАЯ') || line.includes('ВЕЛИЧИНА') || line.includes('ЗВ_ВЕЛИЧИНА')) {
    console.log(`Строка ${index}: "${line}"`);
  }
});

console.log('\n=== ПОИСК БЛОКОВ ФИЛЬТРОВ ===');
lines.forEach((line, index) => {
  if (line.includes('Ф И Л Ь Т Р') && line.includes("'B'")) {
    console.log(`Строка ${index}: "${line}"`);
    // Показываем следующие 10 строк для анализа структуры
    console.log('Следующие 10 строк:');
    for (let i = 1; i <= 10; i++) {
      if (index + i < lines.length) {
        console.log(`  ${index + i}: "${lines[index + i]}"`);
      }
    }
  }
});

console.log('\n=== ПОИСК ЧИСЛОВЫХ ДАННЫХ ===');
lines.forEach((line, index) => {
  // Ищем строки с числами, которые могут быть звездными величинами
  const numbers = line.match(/[\d.-]+/g);
  if (numbers && numbers.length >= 5 && line.length > 20) {
    // Проверяем, что это не заголовок и не координаты
    if (!line.includes('Фильтр') && !line.includes('КООРДИНАТЫ') && !line.includes('ЭТАЛОН') && 
        !line.includes('ПЕРИОД') && !line.includes('***') && !line.includes('═')) {
      console.log(`Строка ${index}: "${line}"`);
      console.log(`  Числа: ${numbers.join(', ')}`);
    }
  }
});
