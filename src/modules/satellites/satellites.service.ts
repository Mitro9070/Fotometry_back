import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Satellite } from '../../entities/satellite.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SatellitesService {
  private readonly logger = new Logger(SatellitesService.name);

  constructor(
    @InjectRepository(Satellite)
    private satelliteRepository: Repository<Satellite>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findByNoradId(noradId: string): Promise<Satellite | null> {
    return this.satelliteRepository.findOne({
      where: { noradId },
    });
  }

  async createOrUpdateFromNorad(noradId: string): Promise<Satellite> {
    try {
      // Проверяем, есть ли уже спутник в базе
      let satellite = await this.findByNoradId(noradId);
      
      if (!satellite) {
        satellite = this.satelliteRepository.create({
          noradId,
          lastUpdated: new Date(),
        });
      }

      // Получаем данные из каталога NORAD
      const noradData = await this.fetchNoradData(noradId);
      
      if (noradData) {
        // Обновляем данные спутника
        Object.assign(satellite, {
          ...noradData,
          lastUpdated: new Date(),
        });
      } else {
        this.logger.warn(`Данные для спутника ${noradId} не найдены в каталоге NORAD`);
      }

      return await this.satelliteRepository.save(satellite);
    } catch (error) {
      this.logger.error(`Ошибка при получении данных спутника ${noradId}:`, error);
      throw error;
    }
  }

  private async fetchNoradData(noradId: string): Promise<Partial<Satellite> | null> {
    try {
      // Сначала пробуем N2YO API (требует регистрации и API ключ)
      const apiKey = this.configService.get<string>('N2YO_API_KEY', 'demo');
      if (apiKey !== 'demo') {
        const url = `https://api.n2yo.com/rest/v1/satellite/tle/${noradId}&apiKey=${apiKey}`;
        
        this.logger.log(`Запрос к N2YO API: ${url}`);
        
        try {
          const response = await firstValueFrom(
            this.httpService.get<any>(url, {
              timeout: 10000,
              headers: {
                'User-Agent': 'PhotometryFactory/1.0',
              },
            })
          );

          this.logger.log(`Ответ от N2YO API:`, response.data);

          if (response.data && response.data.info) {
            const info = response.data.info;
            return {
              satelliteName: info.satname || null,
              internationalCode: info.intDesignator || null,
              launchDate: info.launchDate ? new Date(info.launchDate) : null,
              status: 'IN ORBIT', // По умолчанию
              country: this.extractCountry(info.satname),
              owner: this.extractOwner(info.satname),
              category: this.determineCategory(info.satname),
            };
          }
        } catch (n2yoError) {
          this.logger.warn(`N2YO API недоступен:`, n2yoError.message);
        }
      }

      // Пробуем Celestrak API (NORAD каталог)
      this.logger.log(`Пробуем Celestrak API (NORAD) для ${noradId}`);
      const noradData = await this.fetchAlternativeNoradData(noradId);
      if (noradData) {
        return noradData;
      }

      // Если не найден в NORAD, пробуем каталог Каспар
      this.logger.log(`Пробуем каталог Каспар для ${noradId}`);
      return await this.fetchKasperData(noradId);
    } catch (error) {
      this.logger.warn(`Не удалось получить данные для ${noradId}:`, error.message);
      return null;
    }
  }

  private async fetchAlternativeNoradData(noradId: string): Promise<Partial<Satellite> | null> {
    try {
      // Пробуем разные варианты NORAD ID
      const noradIdVariants = this.generateNoradIdVariants(noradId);
      
      for (const variant of noradIdVariants) {
        const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${variant}&FORMAT=json`;
        
        this.logger.log(`Пробуем Celestrak API с NORAD ID: ${variant}`);
        
        try {
          const response = await firstValueFrom(
            this.httpService.get<any[]>(url, {
              timeout: 10000,
              headers: {
                'User-Agent': 'PhotometryFactory/1.0',
              },
            })
          );

          this.logger.log(`Ответ от Celestrak API для ${variant}:`, response.data);

          // Проверяем, что ответ не является строкой "No GP data found"
          if (typeof response.data === 'string' && (response.data as string).includes('No GP data found')) {
            this.logger.warn(`Спутник не найден в каталоге: ${variant}`);
            continue;
          }

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const tleData = response.data[0];
            this.logger.log(`Найден спутник: ${tleData.OBJECT_NAME} (${tleData.OBJECT_ID})`);
            
            // Получаем TLE данные для этого спутника
            const tleInfo = await this.fetchTleData(tleData.OBJECT_ID);
            
            return {
              satelliteName: tleData.OBJECT_NAME || null,
              internationalCode: tleData.OBJECT_ID || null,
              status: 'IN ORBIT',
              country: this.extractCountry(tleData.OBJECT_NAME),
              owner: this.extractOwner(tleData.OBJECT_NAME),
              category: this.determineCategory(tleData.OBJECT_NAME),
              // TLE данные
              tleLine1: tleInfo?.tleLine1 || null,
              tleLine2: tleInfo?.tleLine2 || null,
              tleEpoch: tleInfo?.tleEpoch || null,
              // Орбитальные характеристики из TLE
              meanMotion: tleData.MEAN_MOTION || null,
              eccentricity: tleData.ECCENTRICITY || null,
              inclinationDeg: tleData.INCLINATION || null,
              raOfAscNode: tleData.RA_OF_ASC_NODE || null,
              argOfPericenter: tleData.ARG_OF_PERICENTER || null,
              meanAnomaly: tleData.MEAN_ANOMALY || null,
              bstar: tleData.BSTAR || null,
              revAtEpoch: tleData.REV_AT_EPOCH || null,
              // Вычисленные орбитальные характеристики
              ...this.calculateOrbitalElements(tleData),
            };
          }
        } catch (error) {
          this.logger.warn(`Ошибка при запросе ${variant}:`, error.message);
        }
      }

      this.logger.warn(`Спутник не найден ни в одном варианте NORAD ID: ${noradIdVariants.join(', ')}`);
      return null;
    } catch (error) {
      this.logger.warn(`Не удалось получить данные из Celestrak для ${noradId}:`, error.message);
      return null;
    }
  }

  private extractCountry(satelliteName: string): string | null {
    if (!satelliteName) return null;
    
    const countryPatterns = {
      'USA': ['USA', 'US', 'UNITED STATES'],
      'RUSSIA': ['RUSSIA', 'RUS', 'COSMOS', 'METEOR', 'GLONASS'],
      'CHINA': ['CHINA', 'CHN', 'BEIDOU', 'TIANGONG'],
      'EUROPE': ['ESA', 'EUROPE', 'GALILEO'],
      'JAPAN': ['JAPAN', 'JPN', 'HIMAWARI'],
      'INDIA': ['INDIA', 'INSAT', 'IRNSS'],
    };

    const upperName = satelliteName.toUpperCase();
    for (const [country, patterns] of Object.entries(countryPatterns)) {
      if (patterns.some(pattern => upperName.includes(pattern))) {
        return country;
      }
    }

    return null;
  }

  private extractOwner(satelliteName: string): string | null {
    if (!satelliteName) return null;
    
    const ownerPatterns = {
      'NASA': ['NASA', 'HST', 'HUBBLE'],
      'NOAA': ['NOAA'],
      'ESA': ['ESA'],
      'ROSCOSMOS': ['COSMOS', 'METEOR'],
      'CNSA': ['TIANGONG', 'BEIDOU'],
    };

    const upperName = satelliteName.toUpperCase();
    for (const [owner, patterns] of Object.entries(ownerPatterns)) {
      if (patterns.some(pattern => upperName.includes(pattern))) {
        return owner;
      }
    }

    return null;
  }

  private determineCategory(satelliteName: string): string | null {
    if (!satelliteName) return null;
    
    const categoryPatterns = {
      'Weather': ['NOAA', 'METEOR', 'HIMAWARI', 'GOES'],
      'Navigation': ['GPS', 'GLONASS', 'GALILEO', 'BEIDOU'],
      'Communication': ['INTELSAT', 'INMARSAT', 'EUTELSAT'],
      'Earth Observation': ['LANDSAT', 'SENTINEL', 'TERRA', 'AQUA'],
      'Space Station': ['ISS', 'TIANGONG'],
      'Military': ['USA', 'MILSTAR', 'DSP'],
    };

    const upperName = satelliteName.toUpperCase();
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(pattern => upperName.includes(pattern))) {
        return category;
      }
    }

    return 'Other';
  }

  private generateNoradIdVariants(noradId: string): string[] {
    const variants = [noradId];
    
    // Убираем ведущие нули
    const withoutLeadingZeros = noradId.replace(/^0+/, '');
    if (withoutLeadingZeros !== noradId) {
      variants.push(withoutLeadingZeros);
    }
    
    // Добавляем ведущие нули до 5 цифр
    if (withoutLeadingZeros.length < 5) {
      const padded5 = withoutLeadingZeros.padStart(5, '0');
      if (padded5 !== noradId) {
        variants.push(padded5);
      }
    }
    
    // Добавляем ведущие нули до 4 цифр
    if (withoutLeadingZeros.length < 4) {
      const padded4 = withoutLeadingZeros.padStart(4, '0');
      if (padded4 !== noradId && !variants.includes(padded4)) {
        variants.push(padded4);
      }
    }
    
    // Если номер длинный, пробуем первые 5 цифр
    if (withoutLeadingZeros.length > 5) {
      const first5 = withoutLeadingZeros.substring(0, 5);
      if (!variants.includes(first5)) {
        variants.push(first5);
      }
    }
    
    // Если номер длинный, пробуем первые 4 цифры
    if (withoutLeadingZeros.length > 4) {
      const first4 = withoutLeadingZeros.substring(0, 4);
      if (!variants.includes(first4)) {
        variants.push(first4);
      }
    }
    
    this.logger.log(`Варианты NORAD ID для ${noradId}: ${variants.join(', ')}`);
    return variants;
  }

  private async fetchKasperData(noradId: string): Promise<Partial<Satellite> | null> {
    try {
      // Пробуем разные варианты NORAD ID для каталога Каспар
      const noradIdVariants = this.generateNoradIdVariants(noradId);
      
      for (const variant of noradIdVariants) {
        // Каталог Каспар API
        const url = `https://kasper.space/api/satellites/${variant}`;
        
        this.logger.log(`Пробуем каталог Каспар с NORAD ID: ${variant}`);
        
        try {
          const response = await firstValueFrom(
            this.httpService.get<any>(url, {
              timeout: 10000,
              headers: {
                'User-Agent': 'PhotometryFactory/1.0',
              },
            })
          );

          this.logger.log(`Ответ от каталога Каспар для ${variant}:`, response.data);

          if (response.data && response.data.name) {
            const kasperData = response.data;
            this.logger.log(`Найден спутник в каталоге Каспар: ${kasperData.name}`);
            return {
              satelliteName: kasperData.name || null,
              internationalCode: kasperData.cospar_id || null,
              launchDate: kasperData.launch_date ? new Date(kasperData.launch_date) : null,
              status: kasperData.status || 'IN ORBIT',
              country: kasperData.country || this.extractCountry(kasperData.name),
              owner: kasperData.owner || this.extractOwner(kasperData.name),
              category: kasperData.category || this.determineCategory(kasperData.name),
              apogeeKm: kasperData.apogee_km || null,
              perigeeKm: kasperData.perigee_km || null,
              inclinationDeg: kasperData.inclination_deg || null,
              periodMin: kasperData.period_min || null,
              eccentricity: kasperData.eccentricity || null,
              semiMajorAxisKm: kasperData.semi_major_axis_km || null,
              massKg: kasperData.mass_kg || null,
              powerW: kasperData.power_w || null,
              missionDescription: kasperData.description || null,
            };
          }
        } catch (error) {
          this.logger.warn(`Ошибка при запросе к каталогу Каспар ${variant}:`, error.message);
        }
      }

      this.logger.warn(`Спутник не найден в каталоге Каспар для NORAD ID: ${noradIdVariants.join(', ')}`);
      return null;
    } catch (error) {
      this.logger.warn(`Не удалось получить данные из каталога Каспар для ${noradId}:`, error.message);
      return null;
    }
  }

  async getAllSatellites() {
    return this.satelliteRepository.find({
      order: { satelliteName: 'ASC' },
    });
  }

  async getSatelliteById(id: number): Promise<Satellite | null> {
    return this.satelliteRepository.findOne({
      where: { id },
      relations: ['observations'],
    });
  }

  private async fetchTleData(cosparId: string): Promise<{ tleLine1: string; tleLine2: string; tleEpoch: Date } | null> {
    try {
      const url = `https://celestrak.org/NORAD/elements/gp.php?INTDES=${cosparId}&FORMAT=tle`;
      
      this.logger.log(`Запрос TLE данных для ${cosparId}: ${url}`);
      
      const response = await firstValueFrom(
        this.httpService.get<string>(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'PhotometryFactory/1.0',
          },
        })
      );

      if (response.data && typeof response.data === 'string') {
        const lines = response.data.trim().split('\n');
        if (lines.length >= 3) {
          const name = lines[0].trim();
          const line1 = lines[1].trim();
          const line2 = lines[2].trim();
          
          // Извлекаем эпоху из TLE (поле 3 в строке 1)
          const epochYear = parseInt(line1.substring(18, 20));
          const epochDay = parseFloat(line1.substring(20, 32));
          const year = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
          const epochDate = new Date(year, 0, 1);
          epochDate.setDate(epochDate.getDate() + epochDay - 1);
          
          this.logger.log(`Получены TLE данные для ${name}:`);
          this.logger.log(`Line 1: ${line1}`);
          this.logger.log(`Line 2: ${line2}`);
          this.logger.log(`Epoch: ${epochDate.toISOString()}`);
          
          return {
            tleLine1: line1,
            tleLine2: line2,
            tleEpoch: epochDate,
          };
        }
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Не удалось получить TLE данные для ${cosparId}:`, error.message);
      return null;
    }
  }

  private calculateOrbitalElements(tleData: any): Partial<Satellite> {
    try {
      // Вычисляем орбитальные элементы из TLE данных
      const mu = 398600.4418; // Гравитационный параметр Земли (км³/с²)
      const meanMotion = tleData.MEAN_MOTION;
      const eccentricity = tleData.ECCENTRICITY;
      
      if (meanMotion && eccentricity) {
        // Период обращения (минуты)
        const periodMin = 1440 / meanMotion;
        
        // Большая полуось (км)
        const semiMajorAxisKm = Math.pow(mu / Math.pow(meanMotion * 2 * Math.PI / 86400, 2), 1/3);
        
        // Апогей и перигей (км)
        const apogeeKm = semiMajorAxisKm * (1 + eccentricity) - 6378.137; // Вычитаем радиус Земли
        const perigeeKm = semiMajorAxisKm * (1 - eccentricity) - 6378.137;
        
        return {
          periodMin,
          semiMajorAxisKm,
          apogeeKm,
          perigeeKm,
        };
      }
      
      return {};
    } catch (error) {
      this.logger.warn(`Ошибка при вычислении орбитальных элементов:`, error.message);
      return {};
    }
  }

  async updateTleData(satelliteId: number): Promise<Satellite | null> {
    try {
      const satellite = await this.satelliteRepository.findOne({
        where: { id: satelliteId },
      });

      if (!satellite || !satellite.internationalCode) {
        this.logger.warn(`Спутник не найден или отсутствует международный код`);
        return null;
      }

      // Получаем свежие TLE данные
      const tleInfo = await this.fetchTleData(satellite.internationalCode);
      
      if (tleInfo) {
        // Обновляем TLE данные
        satellite.tleLine1 = tleInfo.tleLine1;
        satellite.tleLine2 = tleInfo.tleLine2;
        satellite.tleEpoch = tleInfo.tleEpoch;
        satellite.lastUpdated = new Date();
        
        return await this.satelliteRepository.save(satellite);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Ошибка при обновлении TLE данных для спутника ${satelliteId}:`, error);
      throw error;
    }
  }

  /**
   * Создание спутника из TLE данных
   */
  async createFromTLE(
    name: string,
    noradId: string,
    line1: string,
    line2: string,
  ): Promise<Satellite> {
    try {
      // Парсим TLE данные
      const tleData = this.parseTLE(line1, line2);
      
      // Создаем спутник
      const satellite = this.satelliteRepository.create({
        satelliteName: name,
        noradId: noradId,
        tleLine1: line1,
        tleLine2: line2,
        tleEpoch: tleData.epoch,
        inclinationDeg: tleData.inclination,
        raOfAscNode: tleData.raan,
        eccentricity: tleData.eccentricity,
        argOfPericenter: tleData.argOfPerigee,
        meanAnomaly: tleData.meanAnomaly,
        meanMotion: tleData.meanMotion,
        lastUpdated: new Date(),
      });

      // Вычисляем орбитальные элементы
      const orbitalElements = this.calculateOrbitalElementsFromTLE(tleData);
      Object.assign(satellite, orbitalElements);

      return await this.satelliteRepository.save(satellite);
    } catch (error) {
      this.logger.error(`Ошибка при создании спутника из TLE:`, error);
      throw error;
    }
  }

  /**
   * Обновление TLE данных по строкам
   */
  async updateTleDataFromLines(
    satelliteId: number,
    line1: string,
    line2: string,
  ): Promise<Satellite> {
    try {
      const satellite = await this.satelliteRepository.findOne({
        where: { id: satelliteId },
      });

      if (!satellite) {
        throw new Error(`Спутник с ID ${satelliteId} не найден`);
      }

      // Парсим TLE данные
      const tleData = this.parseTLE(line1, line2);

      // Обновляем TLE данные
      satellite.tleLine1 = line1;
      satellite.tleLine2 = line2;
      satellite.tleEpoch = tleData.epoch;
      satellite.inclinationDeg = tleData.inclination;
      satellite.raOfAscNode = tleData.raan;
      satellite.eccentricity = tleData.eccentricity;
      satellite.argOfPericenter = tleData.argOfPerigee;
      satellite.meanAnomaly = tleData.meanAnomaly;
      satellite.meanMotion = tleData.meanMotion;
      satellite.lastUpdated = new Date();

      // Вычисляем орбитальные элементы
      const orbitalElements = this.calculateOrbitalElementsFromTLE(tleData);
      Object.assign(satellite, orbitalElements);

      return await this.satelliteRepository.save(satellite);
    } catch (error) {
      this.logger.error(`Ошибка при обновлении TLE данных:`, error);
      throw error;
    }
  }

  /**
   * Парсинг TLE строк
   */
  private parseTLE(line1: string, line2: string): any {
    try {
      // Парсим эпоху из line1
      const epochYear = parseInt(line1.substring(18, 20));
      const epochDay = parseFloat(line1.substring(20, 32));
      const fullYear = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
      const epoch = new Date(fullYear, 0, 1);
      epoch.setDate(epochDay);

      // Парсим параметры орбиты из line2
      const inclination = parseFloat(line2.substring(8, 16).trim());
      const raan = parseFloat(line2.substring(17, 25).trim());
      const eccentricityStr = line2.substring(26, 33).trim();
      const eccentricity = parseFloat('0.' + eccentricityStr);
      const argOfPerigee = parseFloat(line2.substring(34, 42).trim());
      const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
      const meanMotion = parseFloat(line2.substring(52, 63).trim());

      return {
        epoch,
        inclination,
        raan,
        eccentricity,
        argOfPerigee,
        meanAnomaly,
        meanMotion,
      };
    } catch (error) {
      this.logger.error('Ошибка при парсинге TLE:', error);
      throw error;
    }
  }

  /**
   * Вычисление орбитальных элементов из TLE
   */
  private calculateOrbitalElementsFromTLE(tleData: any): Partial<Satellite> {
    try {
      const mu = 398600.4418; // Гравитационный параметр Земли (км³/с²)
      const meanMotion = tleData.meanMotion;
      const eccentricity = tleData.eccentricity;

      if (meanMotion && eccentricity !== undefined) {
        // Период обращения (минуты)
        const periodMin = 1440 / meanMotion;

        // Большая полуось (км)
        const n = meanMotion * 2 * Math.PI / 86400; // среднее движение в рад/с
        const semiMajorAxisKm = Math.pow(mu / (n * n), 1 / 3);

        // Апогей и перигей (км)
        const apogeeKm = semiMajorAxisKm * (1 + eccentricity) - 6378.137; // Вычитаем радиус Земли
        const perigeeKm = semiMajorAxisKm * (1 - eccentricity) - 6378.137;

        return {
          periodMin,
          semiMajorAxisKm,
          apogeeKm,
          perigeeKm,
        };
      }

      return {};
    } catch (error) {
      this.logger.warn(`Ошибка при вычислении орбитальных элементов:`, error.message);
      return {};
    }
  }
}
