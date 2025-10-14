/**
 * Утилита для расчета положения спутника по TLE данным
 * Использует упрощенную модель SGP4 для расчета орбиты
 */

export interface SatellitePosition {
  latitude: number;    // Широта в градусах
  longitude: number;   // Долгота в градусах
  altitude: number;    // Высота в км
  velocity: number;    // Скорость в км/с
  azimuth: number;     // Азимут в градусах
  elevation: number;   // Угол места в градусах
}

export interface TleData {
  line1: string;
  line2: string;
  epoch: Date;
}

export class SatellitePositionCalculator {
  /**
   * Рассчитывает положение спутника на заданное время
   * @param tleData TLE данные спутника
   * @param time Время для расчета (по умолчанию текущее)
   * @returns Положение спутника
   */
  static calculatePosition(tleData: TleData, time: Date = new Date()): SatellitePosition {
    // Упрощенный расчет на основе TLE
    // В реальном проекте рекомендуется использовать библиотеку satellite.js
    
    try {
      // Парсим TLE данные
      const tle = this.parseTle(tleData.line1, tleData.line2);
      
      // Рассчитываем время от эпохи в минутах
      const minutesFromEpoch = (time.getTime() - tleData.epoch.getTime()) / (1000 * 60);
      
      // Упрощенный расчет положения (для демонстрации)
      // В реальности нужен алгоритм SGP4
      const position = this.simplePositionCalculation(tle, minutesFromEpoch);
      
      return position;
    } catch (error) {
      console.error('Ошибка расчета положения спутника:', error);
      throw new Error('Не удалось рассчитать положение спутника');
    }
  }

  /**
   * Парсит TLE строки
   */
  private static parseTle(line1: string, line2: string) {
    return {
      // Line 1
      noradId: parseInt(line1.substring(2, 7)),
      epochYear: parseInt(line1.substring(18, 20)),
      epochDay: parseFloat(line1.substring(20, 32)),
      meanMotionDot: parseFloat(line1.substring(33, 43)),
      meanMotionDotDot: parseFloat(line1.substring(44, 52)),
      bstar: parseFloat(line1.substring(53, 61)),
      // Line 2
      inclination: parseFloat(line2.substring(8, 16)),
      raOfAscNode: parseFloat(line2.substring(17, 25)),
      eccentricity: parseFloat('0.' + line2.substring(26, 33)),
      argOfPerigee: parseFloat(line2.substring(34, 42)),
      meanAnomaly: parseFloat(line2.substring(43, 51)),
      meanMotion: parseFloat(line2.substring(52, 63)),
      revNumber: parseInt(line2.substring(63, 68)),
    };
  }

  /**
   * Упрощенный расчет положения (для демонстрации)
   * В реальности нужно использовать алгоритм SGP4
   */
  private static simplePositionCalculation(tle: any, minutesFromEpoch: number): SatellitePosition {
    // Упрощенная модель - равномерное движение по орбите
    const meanMotion = tle.meanMotion; // оборотов в день
    const periodMinutes = 1440 / meanMotion; // период в минутах
    
    // Угол поворота от эпохи
    const angle = (minutesFromEpoch / periodMinutes) * 2 * Math.PI;
    
    // Примерные координаты (упрощенно)
    const latitude = Math.sin(angle) * 53; // наклонение орбиты
    const longitude = (angle * 180 / Math.PI) % 360;
    const altitude = 550; // примерная высота Starlink
    
    return {
      latitude: Math.round(latitude * 100) / 100,
      longitude: Math.round(longitude * 100) / 100,
      altitude: Math.round(altitude * 100) / 100,
      velocity: 7.7, // примерная скорость Starlink
      azimuth: 0,
      elevation: 0,
    };
  }

  /**
   * Рассчитывает видимость спутника с заданной точки наблюдения
   * @param satellitePosition Положение спутника
   * @param observerLat Широта наблюдателя
   * @param observerLon Долгота наблюдателя
   * @param observerAlt Высота наблюдателя (км)
   * @returns Информация о видимости
   */
  static calculateVisibility(
    satellitePosition: SatellitePosition,
    observerLat: number,
    observerLon: number,
    observerAlt: number = 0
  ) {
    const earthRadius = 6378.137; // км
    
    // Преобразуем в радианы
    const satLat = satellitePosition.latitude * Math.PI / 180;
    const satLon = satellitePosition.longitude * Math.PI / 180;
    const obsLat = observerLat * Math.PI / 180;
    const obsLon = observerLon * Math.PI / 180;
    
    // Рассчитываем расстояние до спутника
    const satAlt = satellitePosition.altitude;
    const satDistance = earthRadius + satAlt;
    
    // Угловое расстояние между точками
    const angularDistance = Math.acos(
      Math.sin(obsLat) * Math.sin(satLat) +
      Math.cos(obsLat) * Math.cos(satLat) * Math.cos(satLon - obsLon)
    );
    
    // Расстояние по поверхности Земли
    const surfaceDistance = angularDistance * earthRadius;
    
    // Угол места (elevation)
    const elevation = Math.atan2(
      satDistance * Math.cos(angularDistance) - earthRadius,
      satDistance * Math.sin(angularDistance)
    ) * 180 / Math.PI;
    
    // Азимут
    const azimuth = Math.atan2(
      Math.sin(satLon - obsLon) * Math.cos(satLat),
      Math.cos(obsLat) * Math.sin(satLat) - Math.sin(obsLat) * Math.cos(satLat) * Math.cos(satLon - obsLon)
    ) * 180 / Math.PI;
    
    // Видимость (угол места > 10 градусов)
    const isVisible = elevation > 10;
    
    return {
      isVisible,
      elevation: Math.round(elevation * 100) / 100,
      azimuth: Math.round(((azimuth + 360) % 360) * 100) / 100,
      distance: Math.round(surfaceDistance * 100) / 100,
      angularDistance: Math.round(angularDistance * 180 / Math.PI * 100) / 100,
    };
  }

  /**
   * Рассчитывает время следующего пролета спутника над точкой
   * @param tleData TLE данные
   * @param observerLat Широта наблюдателя
   * @param observerLon Долгота наблюдателя
   * @param startTime Время начала поиска
   * @returns Время следующего пролета
   */
  static calculateNextPass(
    tleData: TleData,
    observerLat: number,
    observerLon: number,
    startTime: Date = new Date()
  ) {
    // Упрощенный расчет - ищем ближайший момент, когда спутник будет над точкой
    const tle = this.parseTle(tleData.line1, tleData.line2);
    const meanMotion = tle.meanMotion;
    const periodMinutes = 1440 / meanMotion;
    
    // Примерное время следующего пролета (упрощенно)
    const nextPassTime = new Date(startTime.getTime() + periodMinutes * 60 * 1000);
    
    return {
      nextPassTime,
      duration: 10, // примерная длительность пролета в минутах
      maxElevation: 45, // максимальный угол места
    };
  }
}
