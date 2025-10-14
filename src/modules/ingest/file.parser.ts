import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';
import * as iconv from 'iconv-lite';
import { ObservationIngestDto, StationDto, CoordinateDto, FilterDto } from './dto/observation-ingest.dto';

interface ObservationDto {
  obsDate: string;
  obsNumber: string;
  utcOffsetHours: number;
  averagingPeriodSec?: number;
  etalon?: {
    durationSec: number;
    signal: number;
  };
  satelliteNumber?: string;
  partitionTimeSeconds?: number;
}

interface EtalonDto {
  durationSec: number;
  signal: number;
}

@Injectable()
export class FileParser {
  constructor(private logger: LoggerService) {}

  parse(buffer: Buffer, meta?: { originalName?: string }): ObservationIngestDto {
    try {
      // Декодируем файл с учетом кодировки CP866
      const content = iconv.decode(buffer, 'cp866');
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      this.logger.logParsing(`Начало парсинга файла: ${meta?.originalName || 'unknown'}`);
      this.logger.logParsing(`Количество строк: ${lines.length}`);

      // Извлекаем номер КА и время из имени файла
      const fileInfo = this.extractSatelliteAndTimeFromFilename(meta?.originalName);
      this.logger.logParsing('Информация из имени файла:', fileInfo);
      this.logger.logParsing('Имя файла:', meta?.originalName);

      // Парсим основные блоки
      const station = this.parseStation(lines);
      const observation = this.parseObservation(lines);
      const coordinates = this.parseCoordinates(lines);
      const filters = this.parseFilters(lines);

      // Добавляем информацию из файла к наблюдению
      if (fileInfo) {
        observation.satelliteNumber = fileInfo.satelliteNumber;
        observation.partitionTimeSeconds = fileInfo.timeSeconds;
      }

      const result: ObservationIngestDto = {
        station,
        obsDate: observation.obsDate,
        obsNumber: observation.obsNumber,
        utcOffsetHours: observation.utcOffsetHours,
        averagingPeriodSec: observation.averagingPeriodSec,
        etalon: observation.etalon,
        coordinates,
        filters,
        satelliteNumber: observation.satelliteNumber,
        partitionTimeSeconds: observation.partitionTimeSeconds,
      };

      this.logger.logParsing('Парсинг завершен успешно', {
        station: station.code,
        obsDate: observation.obsDate,
        obsNumber: observation.obsNumber,
        satelliteNumber: observation.satelliteNumber,
        partitionTimeSeconds: observation.partitionTimeSeconds,
        coordinatesCount: coordinates.length,
        filtersCount: filters.length,
        filters: filters.map(f => ({ code: f.code, magnitude: f.starMagnitude, signalsCount: f.rawSignals.length, magnitudesCount: f.instrumentalMagnitudes.length })),
      });

      return result;
    } catch (error) {
      this.logger.logError(error, 'FileParser.parse');
      throw new Error(`Ошибка парсинга файла: ${error.message}`);
    }
  }

  /**
   * Извлекает время из имени файла
   * Формат: YYMMDDHH.MM (например: 09042224.15 -> 2009-04-22 24:15)
   */
  private extractTimeFromFilename(filename?: string): string | null {
    if (!filename) return null;

    // Извлекаем базовое имя файла без расширения
    const baseName = filename.replace(/\.[^/.]+$/, '');
    
    // Проверяем формат YYMMDDHH.MM
    const match = baseName.match(/^(\d{2})(\d{2})(\d{2})(\d{2})\.(\d{2})$/);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match;
    const fullYear = 2000 + parseInt(year);
    
    // Формируем дату и время
    const date = `${fullYear}-${month}-${day}`;
    const time = `${hour}:${minute}:00`;
    
    return `${date}T${time}`;
  }

  /**
   * Извлекает номер КА и время из имени файла
   * Формат: YYMMDDHH.MM (например: 09042224.15 -> КА: 09042224, время: 15 сек)
   */
  private extractSatelliteAndTimeFromFilename(filename?: string): { satelliteNumber: string; timeSeconds: number } | null {
    if (!filename) return null;

    // Проверяем формат YYMMDDHH.MM (например: 09043024.50E -> КА: 09043024, время: 50 сек)
    const match = filename.match(/^(\d{8})\.(\d{2})[A-Z]$/);
    if (!match) {
      console.log(`ОТЛАДКА: Не удалось распарсить имя файла "${filename}"`);
      return null;
    }

    const [, satelliteNumber, timeStr] = match;
    const timeSeconds = parseInt(timeStr);
    
    console.log(`ОТЛАДКА: Извлечены данные из файла "${filename}": satelliteNumber="${satelliteNumber}", timeSeconds=${timeSeconds}`);
    
    return {
      satelliteNumber,
      timeSeconds
    };
  }

  private parseStation(lines: string[]): StationDto {
    // Ищем строку с ПУНКТ более гибко
    const stationLine = lines.find(line => 
      line.includes('ПУНКТ') || 
      line.includes('0021') // Ищем по коду станции как запасной вариант
    );
    
    if (!stationLine) {
      // Показываем первые 10 строк для отладки
      console.log('Первые 10 строк файла:');
      lines.slice(0, 10).forEach((line, index) => {
        console.log(`${index}: "${line}"`);
      });
      throw new Error('Блок ПУНКТ не найден');
    }

    console.log('Найдена строка станции:', stationLine);

    // Пример: ПУНКТ 0021   Астрон_широта 45.5359  Долгота 73.3601   Высота 306.0
    const codeMatch = stationLine.match(/ПУНКТ\s+(\d+)/);
    const latMatch = stationLine.match(/Астрон_широта\s+([\d.]+)/);
    const lonMatch = stationLine.match(/Долгота\s+([\d.]+)/);
    const altMatch = stationLine.match(/Высота\s+([\d.]+)/);

    if (!codeMatch || !latMatch || !lonMatch || !altMatch) {
      throw new Error('Неверный формат блока ПУНКТ');
    }

    return {
      code: codeMatch[1],
      latitudeDeg: parseFloat(latMatch[1]),
      longitudeDeg: parseFloat(lonMatch[1]),
      altitudeM: parseFloat(altMatch[1]),
    };
  }

  private parseObservation(lines: string[]): ObservationDto {
    // Ищем строку с датой более гибко
    const dateLine = lines.find(line =>
      line.includes('ДАТА') && line.includes('НОМЕР')
    );

    if (!dateLine) {
      // Если не найдена строка с ДАТА и НОМЕР, ищем отдельно
      const dateOnlyLine = lines.find(line => line.includes('ДАТА'));
      const numberOnlyLine = lines.find(line => line.includes('НОМЕР'));

      if (dateOnlyLine && numberOnlyLine) {
        // Объединяем строки для парсинга
        const combinedLine = dateOnlyLine + ' ' + numberOnlyLine;
        console.log('Найдена объединенная строка даты:', combinedLine);
        return this.parseObservationFromLine(combinedLine, lines);
      }

      throw new Error('Блок ДАТА/НОМЕР не найден');
    }

    console.log('Найдена строка даты:', dateLine);
    return this.parseObservationFromLine(dateLine, lines);
  }

  private parseObservationFromLine(dateLine: string, lines: string[]): ObservationDto {
    // Извлекаем дату более гибко
    const dateMatch = this.extractDateFromString(dateLine);
    const numberMatch = dateLine.match(/НОМЕР\s+(\d+)/);
    const utcMatch = lines.find(line => line.includes('разность со Всемирным временем'))?.match(/(\d+)\s+час/);

    if (!dateMatch || !numberMatch) {
      console.log('Ошибка парсинга: Неверный формат блока ДАТА/НОМЕР');
      console.log('Строка даты:', dateLine);
      console.log('dateMatch:', dateMatch);
      console.log('numberMatch:', numberMatch);
      throw new Error('Неверный формат блока ДАТА/НОМЕР');
    }

    // Преобразуем дату из DD/MM-YYYY в YYYY-MM-DD
    const obsDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    const averagingMatch = lines.find(line => line.includes('ПЕРИОД УСРЕДНЕНИЯ'))?.match(/=\s*(\d+\.?\d*)\s*сек/);
    const etalonMatch = lines.find(line => line.includes('ЭТАЛОН'))?.match(/сигнал за (\d+\.?\d*)\s*сек\s+(\d+\.?\d*)/);

    return {
      obsDate,
      obsNumber: numberMatch[1],
      utcOffsetHours: utcMatch ? parseInt(utcMatch[1]) : 0,
      averagingPeriodSec: averagingMatch ? parseFloat(averagingMatch[1]) : undefined,
      etalon: etalonMatch ? {
        durationSec: parseFloat(etalonMatch[1]),
        signal: parseFloat(etalonMatch[2]),
      } : undefined,
      satelliteNumber: undefined,
      partitionTimeSeconds: undefined,
    };
  }

  private extractDateFromString(dateLine: string): RegExpMatchArray | null {
    // Пробуем разные форматы даты
    const patterns = [
      /ДАТА\s+(\d{2})\/(\d{2})\s*-\s*(\d{4})/,           // ДАТА  25/09 - 2006
      /ДАТА\s+(\d{2})\/(\d{2})\s*[^\d\s]*\s*(\d{4})/,    // ДАТА  22/04 ─ 2009 (с любым символом)
      /ДАТА\s+(\d{2})\/(\d{2})\s+(\d{4})/,               // ДАТА  22/04 2009 (без разделителя)
    ];

    for (const pattern of patterns) {
      const match = dateLine.match(pattern);
      if (match) {
        console.log(`Найдена дата с паттерном ${pattern}:`, match);
        return match;
      }
    }

    console.log('Не удалось извлечь дату из строки:', dateLine);
    return null;
  }

  private parseCoordinates(lines: string[]): CoordinateDto[] {
    const coordinates: CoordinateDto[] = [];
    let inCoordinatesBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('КООРДИНАТЫ:')) {
        inCoordinatesBlock = true;
        continue;
      }

      if (inCoordinatesBlock && line) {
        // Парсим строку координат: "1.25590 -15.1310 19.30000"
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const hourAngle = parseFloat(parts[0]);
          const deltaDeg = parseFloat(parts[1]);
          const timeLocalDecHours = parseFloat(parts[2]);

          if (!isNaN(hourAngle) && !isNaN(deltaDeg) && !isNaN(timeLocalDecHours)) {
            coordinates.push({
              hourAngleDeg: hourAngle,
              deltaDeg,
              timeLocalDecHours,
            });
          }
        }
      }

      // Выходим из блока координат при встрече пустой строки или нового блока
      if (inCoordinatesBlock && (line === '' || line.includes('ПЕРИОД УСРЕДНЕНИЯ'))) {
        break;
      }
    }

    return coordinates;
  }

  /**
   * Парсит эталонные данные для фильтров
   * Формат:
   * Э Т А Л О Н :   сигнал за 10.0 сек      2441.0
   * Фильтр     Зв_вел    А─ekst      В─ekst      ekst    сигма
   *   'B'      12.52      0.868      -0.0843     0.425   0.037
   *   'V'      12.33      0.647      -0.0772     0.240   0.026
   *   'R'      11.37      0.668      -0.1000     0.139   0.030
   */
  private parseEtalonData(lines: string[]): Record<string, { magnitude: number; aExt: number; bExt: number; ext: number; sigma: number }> {
    const etalonData: Record<string, { magnitude: number; aExt: number; bExt: number; ext: number; sigma: number }> = {};
    let inEtalonBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ищем начало блока эталона (учитываем кодировку CP866)
      if (line.includes('Э Т А Л О Н') || line.includes('ЭТАЛОН') || line.includes('Э') && line.includes('Т') && line.includes('А') && line.includes('Л') && line.includes('О') && line.includes('Н')) {
        inEtalonBlock = true;
        this.logger.logParsing('Найден блок эталона:', line);
        continue;
      }

      // Ищем заголовок таблицы фильтров (учитываем кодировку CP866)
      if (inEtalonBlock && (line.includes('Фильтр') || line.includes('')) && (line.includes('Зв_вел') || line.includes('_'))) {
        continue;
      }

      // Парсим строки с данными фильтров
      if (inEtalonBlock && line.includes("'")) {
        // Формат: 'B'      12.52      0.868      -0.0843     0.444   0.037
        const filterMatch = line.match(/'([BVR])'\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/);
        if (filterMatch) {
          const [, filterCode, magnitude, aExt, bExt, ext, sigma] = filterMatch;
          etalonData[filterCode] = {
            magnitude: parseFloat(magnitude),
            aExt: parseFloat(aExt),
            bExt: parseFloat(bExt),
            ext: parseFloat(ext),
            sigma: parseFloat(sigma),
          };
          this.logger.logParsing(`Найдены эталонные данные для фильтра ${filterCode}:`, etalonData[filterCode]);
        }
      }

      // Выходим из блока эталона при встрече пустой строки или нового блока
      if (inEtalonBlock && (line === '' || line.includes('КООРДИНАТЫ') || line.includes('ПЕРИОД УСРЕДНЕНИЯ'))) {
        break;
      }
    }

    console.log('Все эталонные данные:', etalonData);
    return etalonData;
  }

  /**
   * Парсит параметры фильтров
   * Формат:
   * Фильтр  Начало_эксп  Интерв,мин  шаг,сек  фон_за_30.0_сек  число_отсч
   *  'B'     2.04570        4.00      0.500         0.0            480
   *  'V'     2.08590        4.00      0.500         0.0            480
   *  'R'     2.13010        4.00      0.500         0.0            480
   */
  private parseFilterParameters(lines: string[]): Record<string, { startExp: number; intervalMin: number; stepSec: number; background30s: number; samplesCount: number }> {
    const filterParams: Record<string, { startExp: number; intervalMin: number; stepSec: number; background30s: number; samplesCount: number }> = {};
    let inParamsBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ищем начало блока параметров фильтров (учитываем кодировку CP866)
      if ((line.includes('Фильтр') || line.includes('')) && (line.includes('Начало_эксп') || line.includes('_')) && (line.includes('Интерв,мин') || line.includes(','))) {
        inParamsBlock = true;
        this.logger.logParsing('Найден блок параметров фильтров:', line);
        continue;
      }

      // Парсим строки с данными параметров фильтров
      if (inParamsBlock && line.includes("'")) {
        // Формат: 'B'     1.13330        4.00      0.500      9800.0            480
        const paramMatch = line.match(/'([BVR])'\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)/);
        if (paramMatch) {
          const [, filterCode, startExp, intervalMin, stepSec, background30s, samplesCount] = paramMatch;
          filterParams[filterCode] = {
            startExp: parseFloat(startExp),
            intervalMin: parseFloat(intervalMin),
            stepSec: parseFloat(stepSec),
            background30s: parseFloat(background30s),
            samplesCount: parseInt(samplesCount),
          };
          this.logger.logParsing(`Найдены параметры для фильтра ${filterCode}:`, filterParams[filterCode]);
        }
      }

      // Выходим из блока параметров при встрече пустой строки или нового блока
      if (inParamsBlock && (line === '' || line.includes('***') || line.includes('МАКСИМАЛЬНЫЕ ПИКИ'))) {
        break;
      }
    }

    console.log('Все параметры фильтров:', filterParams);
    return filterParams;
  }

  private parseFilters(lines: string[]): FilterDto[] {
    const filters: FilterDto[] = [];
    let currentFilter: Partial<FilterDto> | null = null;
    
    this.logger.logParsing('Начало парсинга фильтров');
    
    // Сначала парсим эталонные данные
    const etalonData = this.parseEtalonData(lines);
    
    // Парсим параметры фильтров
    const filterParams = this.parseFilterParameters(lines);
    
    this.logger.logParsing('Эталонные данные:', etalonData);
    this.logger.logParsing('Параметры фильтров:', filterParams);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ищем блок фильтра (учитываем кодировку CP866)
      const filterMatch = line.match(/Фильтр\s+(\w+)\s+Начало\s+эксп\s+(\d+\.\d+)\s+Число\s+отсч\s+(\d+)/) ||
                         line.match(/.*Фильтр.*(\w+).*Начало.*эксп.*(\d+\.\d+).*Число.*отсч.*(\d+)/) ||
                         line.match(/Ф И Л Ь Т Р\s+['"](\w+)['"]\s+Начало\s+эксп\s+(\d+\.\d+)/);
      if (filterMatch) {
        if (currentFilter) {
          this.fillMissingData(currentFilter);
          filters.push(currentFilter as FilterDto);
        }

        const filterCode = filterMatch[1];
        const etalonInfo = etalonData[filterCode];
        const params = filterParams[filterCode];

        currentFilter = {
          code: filterCode,
          experiment: {
            exposureStart: params?.startExp || parseFloat(filterMatch[2]),
            intervalMin: params?.intervalMin || 0,
            stepSec: params?.stepSec || 0,
            background30Sec: params?.background30s || 0,
            countNumber: params?.samplesCount || parseInt(filterMatch[3]),
          },
          starMagnitude: etalonInfo?.magnitude || 0,
          aExt: etalonInfo?.aExt || 0,
          bExt: etalonInfo?.bExt || 0,
          extinction: etalonInfo?.ext || 0,
          sigma: etalonInfo?.sigma || 0,
          spectralPeaks: [],
          rawSignals: [],
          instrumentalMagnitudes: [],
          averagedMagnitudes: [],
          summaryStats: {
            alpha: 0,
            zenith: 0,
            delta: 0,
            azimuth: 0,
            hourAngle: 0,
            phaseAngle: 0,
            discreteTime: 0,
            siderealTime: 0,
            instrumentalStarMagnitude: 0,
          },
        };
        console.log(`Создан фильтр ${currentFilter.code} с ${currentFilter.experiment.countNumber} отсчетами и эталонными данными:`, etalonInfo);
        console.log(`Параметры фильтра ${currentFilter.code}:`, params);
      }

      // Парсим сырые сигналы
      if (line.includes('ИСХОДНЫЙ СИГНАЛ МИНУС ФОН') || 
          (line.includes('ИСХОДНЫЙ') && line.includes('СИГНАЛ') && currentFilter && !currentFilter.rawSignals.length)) {
        console.log('Найден блок сигналов:', line);
        currentFilter.rawSignals = this.parseNumberArray(lines, i + 1, currentFilter.experiment.countNumber);
      }

      // Парсим инструментальные величины
      if (line.includes('ИНСТРУМЕНТАЛЬНАЯ  ЗВЕЗДНАЯ  ВЕЛИЧИНА') && currentFilter && !currentFilter.instrumentalMagnitudes.length) {
        this.logger.logParsing('Найден блок величин:', line);
        currentFilter.instrumentalMagnitudes = this.parseNumberArray(lines, i + 1, currentFilter.experiment.countNumber);
      }

      // Парсим усредненные величины
      if (line.includes('УСРЕДНЕННЫЕ ВЕЛИЧИНЫ') && currentFilter) {
        currentFilter.averagedMagnitudes = this.parseMagnitudeAveraged(lines, i + 1);
      }
    }

    // Добавляем последний фильтр
    if (currentFilter) {
      this.fillMissingData(currentFilter);
      filters.push(currentFilter as FilterDto);
    }

    return filters;
  }

  private parseNumberArray(lines: string[], startIndex: number, expectedLength: number): number[] {
    const numbers: number[] = [];
    
    console.log(`Парсинг массива чисел, ожидается ${expectedLength} элементов, начиная со строки ${startIndex}`);
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Более мягкие условия остановки - только явные разделители
      if (line.startsWith('***') || line.startsWith('Фильтр') || 
          line.includes('ЭТАЛОН') || line.includes('КООРДИНАТЫ') ||
          line.includes('ПЕРИОД УСРЕДНЕНИЯ')) {
        console.log(`Остановка парсинга на строке ${i}: "${line}"`);
        break;
      }

      // Пропускаем пустые строки
      if (line.trim().length === 0) {
        continue;
      }

      // Пропускаем строки с заголовками
      if (line.includes('ИСХОДНЫЙ СИГНАЛ') || line.includes('ИНСТРУМЕНТАЛЬНЫЕ') || 
          line.includes('МАКСИМАЛЬНЫЕ ПИКИ') || line.includes('ИНСТРУМЕНТАЛЬНАЯ ЗВ_ВЕЛ')) {
        console.log(`Пропуск заголовка на строке ${i}: "${line}"`);
        continue;
      }

      const parts = line.split(/\s+/).filter(part => part.length > 0);
      
      // Проверяем, что строка содержит числа
      let hasNumbers = false;
      for (const part of parts) {
        const num = parseFloat(part);
        if (!isNaN(num)) {
          numbers.push(num);
          hasNumbers = true;
        }
      }

      if (hasNumbers) {
        console.log(`Строка ${i}: "${line}" -> найдено ${parts.filter(p => !isNaN(parseFloat(p))).length} чисел`);
      }

      // Продолжаем парсинг с запасом (на 20% больше ожидаемого)
      if (numbers.length >= expectedLength * 1.2) {
        console.log(`Достигнуто количество элементов с запасом: ${numbers.length}`);
        break;
      }
    }

    console.log(`Парсинг завершен, найдено ${numbers.length} элементов из ${expectedLength}`);
    
    // Возвращаем точное количество или все найденные элементы
    if (numbers.length >= expectedLength) {
      return numbers.slice(0, expectedLength);
    } else {
      console.log(`ВНИМАНИЕ: Найдено меньше элементов (${numbers.length}) чем ожидалось (${expectedLength})`);
      return numbers;
    }
  }

  private parseMagnitudeAveraged(lines: string[], startIndex: number): any[] {
    const averages: any[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('---') || line.startsWith('Фильтр')) {
        break;
      }

      const parts = line.split(/\s+/).filter(part => part.length > 0);
      if (parts.length >= 3) {
        averages.push({
          index: parseInt(parts[0]),
          timeLocalDecHours: parseFloat(parts[1]),
          magnitude: parseFloat(parts[2]),
        });
      }
    }

    return averages;
  }

  private parseSpectralPeaks(lines: string[], startIndex: number): any[] {
    const peaks: any[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('---') || line.startsWith('Фильтр')) {
        break;
      }

      const parts = line.split(/\s+/).filter(part => part.length > 0);
      if (parts.length >= 5) {
        peaks.push({
          rank: parseInt(parts[0]),
          amplitude: parseFloat(parts[1]),
          no: parseInt(parts[2]),
          percentile: parseFloat(parts[3]),
          periodSec: parseFloat(parts[4]),
        });
      }
    }

    return peaks;
  }

  private isNumberLine(line: string): boolean {
    // Проверяем, содержит ли строка числа (включая отрицательные и десятичные)
    const numberPattern = /-?\d+\.?\d*/g;
    const matches = line.match(numberPattern);
    
    // Строка должна содержать минимум 5 чисел и не должна быть заголовком
    const isHeader = line.includes('ИСХОДНЫЙ') || line.includes('ИНСТРУМЕНТАЛЬНЫЕ') || 
                    line.includes('МАКСИМАЛЬНЫЕ') || line.includes('ЭТАЛОН') ||
                    line.includes('КООРДИНАТЫ') || line.includes('ПЕРИОД') ||
                    line.includes('Фильтр') || line.startsWith('***');
    
    return matches && matches.length >= 5 && !isHeader;
  }

     private fillMissingData(filter: Partial<FilterDto>): void {
     // Устанавливаем значения по умолчанию для недостающих полей
     if (!filter.rawSignals) {
       filter.rawSignals = [];
     }
     if (!filter.instrumentalMagnitudes) {
       filter.instrumentalMagnitudes = [];
     }
     if (!filter.averagedMagnitudes) {
       filter.averagedMagnitudes = [];
     }
     if (!filter.spectralPeaks) {
       filter.spectralPeaks = [];
     }
     if (!filter.summaryStats) {
       filter.summaryStats = {
         alpha: 0,
         zenith: 0,
         delta: 0,
         azimuth: 0,
         hourAngle: 0,
         phaseAngle: 0,
         discreteTime: 0,
         siderealTime: 0,
         instrumentalStarMagnitude: 0,
       };
     }
   }

  private validateAndCompleteFilter(filter: Partial<FilterDto>): FilterDto {
    if (!filter.code || !filter.experiment) {
      throw new Error('Неполные данные фильтра');
    }

    // Проверяем наличие массивов данных
    if (!filter.rawSignals || filter.rawSignals.length === 0) {
      console.log(`ВНИМАНИЕ: Фильтр ${filter.code} не содержит данных сигналов`);
      filter.rawSignals = [];
    }

    if (!filter.instrumentalMagnitudes || filter.instrumentalMagnitudes.length === 0) {
      console.log(`ВНИМАНИЕ: Фильтр ${filter.code} не содержит данных величин`);
      filter.instrumentalMagnitudes = [];
    }

    // Более мягкая валидация - допускаем неполные данные
    if (filter.rawSignals.length !== filter.experiment.countNumber) {
      console.log(`ВНИМАНИЕ: Длина массива сигналов (${filter.rawSignals.length}) не соответствует количеству отсчетов (${filter.experiment.countNumber})`);
    }

    if (filter.instrumentalMagnitudes.length !== filter.experiment.countNumber) {
      console.log(`ВНИМАНИЕ: Длина массива величин (${filter.instrumentalMagnitudes.length}) не соответствует количеству отсчетов (${filter.experiment.countNumber})`);
    }

    return filter as FilterDto;
  }
}

