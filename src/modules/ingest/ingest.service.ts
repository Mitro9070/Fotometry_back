import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Observation } from '../../entities/observation.entity';
import { Coordinate } from '../../entities/coordinate.entity';
import { Filter } from '../../entities/filter.entity';
import { FilterExperiment } from '../../entities/filter-experiment.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { RawSignal } from '../../entities/raw-signal.entity';
import { InstrumentalMagnitude } from '../../entities/instrumental-magnitude.entity';
import { AveragedMagnitude } from '../../entities/averaged-magnitude.entity';
import { SummaryStat } from '../../entities/summary-stat.entity';
import { ObservationIngestDto } from './dto/observation-ingest.dto';
import { IngestResultDto } from './dto/ingest-result.dto';
import { LoggerService } from '../../common/logger/logger.service';
import { FileParser } from './file.parser';
import { SatellitesService } from '../satellites/satellites.service';

export interface StoreResult {
  observationId: number;
  status: 'stored';
  duplicates: boolean;
  warnings: string[];
}

@Injectable()
export class IngestService {
  constructor(
    @InjectRepository(Observation)
    private observationRepository: Repository<Observation>,
    @InjectRepository(Coordinate)
    private coordinateRepository: Repository<Coordinate>,
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
    @InjectRepository(FilterExperiment)
    private filterExperimentRepository: Repository<FilterExperiment>,
    @InjectRepository(SpectralPeak)
    private spectralPeakRepository: Repository<SpectralPeak>,
    @InjectRepository(RawSignal)
    private rawSignalRepository: Repository<RawSignal>,
    @InjectRepository(InstrumentalMagnitude)
    private instrumentalMagnitudeRepository: Repository<InstrumentalMagnitude>,
    @InjectRepository(AveragedMagnitude)
    private averagedMagnitudeRepository: Repository<AveragedMagnitude>,
    @InjectRepository(SummaryStat)
    private summaryStatRepository: Repository<SummaryStat>,
    private fileParser: FileParser,
    private dataSource: DataSource,
    private logger: LoggerService,
    private satellitesService: SatellitesService,
  ) {}

  async ingestFromFile(file: Express.Multer.File): Promise<IngestResultDto> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new BadRequestException('Файл слишком большой. Максимальный размер: 50MB');
    }

    try {
      const parser = new FileParser(this.logger);
      const parsedData = parser.parse(file.buffer, {
        originalName: file.originalname,
      });

      return this.ingestFromJson(parsedData);
    } catch (error) {
      this.logger.logError(error, 'IngestService.ingestFromFile');
      throw new BadRequestException(`Ошибка парсинга файла: ${error.message}`);
    }
  }

  async ingestFromJson(data: ObservationIngestDto): Promise<IngestResultDto> {
    this.logger.log('=== НАЧАЛО ИНГЕСТА ИЗ JSON ===');
    this.logger.log('Данные для ингеста', JSON.stringify(data, null, 2));

    // Для партиций создаем уникальный ключ: номер КА + дата + время партиции
    const uniqueKey = data.satelliteNumber 
      ? `${data.satelliteNumber}_${data.obsDate}_${data.partitionTimeSeconds || 0}`
      : `${data.station.code}_${data.obsDate}_${data.obsNumber}`;

    // Проверяем существование наблюдения по уникальному ключу
    const existingObservation = await this.observationRepository.findOne({
      where: data.satelliteNumber 
        ? {
            satelliteNumber: data.satelliteNumber,
            dateObs: new Date(data.obsDate),
            partitionTimeSeconds: data.partitionTimeSeconds || 0,
          }
        : {
            pointCode: data.station.code,
            dateObs: new Date(data.obsDate),
            obsNumber: data.obsNumber,
          },
    });

    if (existingObservation) {
      this.logger.logError(new Error(`Наблюдение уже существует: ${existingObservation.id}`));
      throw new ConflictException(`Наблюдение уже существует: ${existingObservation.id}`);
    }

    // Создаем новое наблюдение
    const observation = this.observationRepository.create({
      pointCode: data.station.code,
      latitude: data.station.latitudeDeg,
      longitude: data.station.longitudeDeg,
      altitude: data.station.altitudeM,
      dateObs: new Date(data.obsDate),
      obsNumber: data.obsNumber,
      timeOffsetUtc: data.utcOffsetHours,
      etalonSignal: data.etalon?.signal || null,
      etalonDuration: data.etalon?.durationSec || null,
      avgPeriod: data.averagingPeriodSec || null,
      satelliteNumber: data.satelliteNumber || null,
      partitionTimeSeconds: data.partitionTimeSeconds || null,
    });

    const savedObservation = await this.observationRepository.save(observation);
    this.logger.log(`Создано наблюдение с ID: ${savedObservation.id} (${uniqueKey})`);

    // Автоматически получаем данные спутника из каталога NORAD
    if (data.satelliteNumber) {
      try {
        this.logger.log(`Получаем данные спутника ${data.satelliteNumber} из каталога NORAD...`);
        const satellite = await this.satellitesService.createOrUpdateFromNorad(data.satelliteNumber);
        
        // Связываем наблюдение со спутником
        savedObservation.satelliteId = satellite.id;
        await this.observationRepository.save(savedObservation);
        
        this.logger.log(`Спутник ${data.satelliteNumber} связан с наблюдением ${savedObservation.id}`);
      } catch (error) {
        this.logger.logError(error, `Ошибка при получении данных спутника ${data.satelliteNumber}`);
        // Не прерываем процесс ингеста, если не удалось получить данные спутника
      }
    }

    // Сохраняем координаты
    if (data.coordinates && data.coordinates.length > 0) {
      const coordinates = data.coordinates.map(coord => {
        const time = coord.timeLocalDecHours !== null && !isNaN(coord.timeLocalDecHours) 
          ? this.convertDecimalHoursToDate(data.obsDate, coord.timeLocalDecHours)
          : null;

        return this.coordinateRepository.create({
          observationId: savedObservation.id,
          hourAngle: coord.hourAngleDeg !== null && !isNaN(coord.hourAngleDeg) ? coord.hourAngleDeg : null,
          delta: coord.deltaDeg !== null && !isNaN(coord.deltaDeg) ? coord.deltaDeg : null,
          time: time,
        });
      });

      await this.coordinateRepository.save(coordinates);
      this.logger.log(`Сохранено ${coordinates.length} координат`);
    }

    // Сохраняем фильтры и связанные данные
    if (data.filters && data.filters.length > 0) {
      for (const filterData of data.filters) {
        // Создаем фильтр
        const filter = this.filterRepository.create({
          observationId: savedObservation.id,
          filterCode: filterData.code,
          magnitude: filterData.starMagnitude !== null && !isNaN(filterData.starMagnitude) ? filterData.starMagnitude : null,
          aExt: filterData.aExt !== null && !isNaN(filterData.aExt) ? filterData.aExt : null,
          bExt: filterData.bExt !== null && !isNaN(filterData.bExt) ? filterData.bExt : null,
          ext: filterData.extinction !== null && !isNaN(filterData.extinction) ? filterData.extinction : null,
          sigma: filterData.sigma !== null && !isNaN(filterData.sigma) ? filterData.sigma : null,
        });

        const savedFilter = await this.filterRepository.save(filter);

        // Создаем эксперимент фильтра
        if (filterData.experiment) {
          const experiment = this.filterExperimentRepository.create({
            filterId: savedFilter.id,
            startExp: filterData.experiment.exposureStart !== null && !isNaN(filterData.experiment.exposureStart) ? filterData.experiment.exposureStart : null,
            intervalMin: filterData.experiment.intervalMin !== null && !isNaN(filterData.experiment.intervalMin) ? filterData.experiment.intervalMin : null,
            stepSec: filterData.experiment.stepSec !== null && !isNaN(filterData.experiment.stepSec) ? filterData.experiment.stepSec : null,
            background30s: filterData.experiment.background30Sec !== null && !isNaN(filterData.experiment.background30Sec) ? filterData.experiment.background30Sec : null,
            samplesCount: filterData.experiment.countNumber !== null && !isNaN(filterData.experiment.countNumber) ? filterData.experiment.countNumber : null,
          });

          await this.filterExperimentRepository.save(experiment);
        }

        // Сохраняем спектральные пики
        if (filterData.spectralPeaks && filterData.spectralPeaks.length > 0) {
          const peaks = filterData.spectralPeaks.map(peak => 
            this.spectralPeakRepository.create({
              filterId: savedFilter.id,
              rank: peak.peakNumber !== null && !isNaN(peak.peakNumber) ? peak.peakNumber : null,
              amplitude: peak.amplitude !== null && !isNaN(peak.amplitude) ? peak.amplitude : null,
              no: peak.number !== null && !isNaN(peak.number) ? peak.number : null,
              pPercent: peak.percentage !== null && !isNaN(peak.percentage) ? peak.percentage : null,
              tSec: peak.timeSec !== null && !isNaN(peak.timeSec) ? peak.timeSec : null,
            })
          );

          await this.spectralPeakRepository.save(peaks);
        }

        // Сохраняем сырые сигналы
        if (filterData.rawSignals && filterData.rawSignals.length > 0) {
          const signals = filterData.rawSignals.map((signal, index) => 
            this.rawSignalRepository.create({
              filterId: savedFilter.id,
              indexPos: index,
              value: signal !== null && !isNaN(signal) ? signal : null,
            })
          );

          await this.rawSignalRepository.save(signals);
        }

        // Сохраняем инструментальные величины
        if (filterData.instrumentalMagnitudes && filterData.instrumentalMagnitudes.length > 0) {
          const magnitudes = filterData.instrumentalMagnitudes.map((mag, index) => 
            this.instrumentalMagnitudeRepository.create({
              filterId: savedFilter.id,
              indexPos: index,
              value: mag !== null && !isNaN(mag) ? mag : null,
            })
          );

          await this.instrumentalMagnitudeRepository.save(magnitudes);
        }

        // Сохраняем усредненные величины
        if (filterData.averagedMagnitudes && filterData.averagedMagnitudes.length > 0) {
          const avgMagnitudes = filterData.averagedMagnitudes.map((avgMag, index) => {
            const time = avgMag.timeLocalDecHours !== null && !isNaN(avgMag.timeLocalDecHours)
              ? this.convertDecimalHoursToDate(data.obsDate, avgMag.timeLocalDecHours)
              : null;

            return this.averagedMagnitudeRepository.create({
              filterId: savedFilter.id,
              indexPos: index,
              time: time,
              mag: avgMag.magnitudeValue !== null && !isNaN(avgMag.magnitudeValue) ? avgMag.magnitudeValue : null,
            });
          });

          await this.averagedMagnitudeRepository.save(avgMagnitudes);
        }

        // Сохраняем сводную статистику
        if (filterData.summaryStats) {
          const summaryStat = this.summaryStatRepository.create({
            filterId: savedFilter.id,
            magMin: filterData.summaryStats.alpha !== null && !isNaN(filterData.summaryStats.alpha) ? filterData.summaryStats.alpha : null,
            magMax: filterData.summaryStats.zenith !== null && !isNaN(filterData.summaryStats.zenith) ? filterData.summaryStats.zenith : null,
            magAvg: filterData.summaryStats.delta !== null && !isNaN(filterData.summaryStats.delta) ? filterData.summaryStats.delta : null,
          });

          await this.summaryStatRepository.save(summaryStat);
        }
      }

      this.logger.log(`Сохранено ${data.filters.length} фильтров с данными`);
    }

    this.logger.log('=== ИНГЕСТ ЗАВЕРШЕН УСПЕШНО ===');

    return {
      observationId: savedObservation.id,
      status: 'stored',
      duplicates: false,
      warnings: [],
    };
  }

  /**
   * Конвертирует десятичные часы в Date объект
   */
  private convertDecimalHoursToDate(dateString: string, decimalHours: number): Date | null {
    if (decimalHours === null || isNaN(decimalHours)) {
      return null;
    }

    // Преобразуем десятичные часы в часы и минуты
    let hours = Math.floor(decimalHours);
    const minutes = Math.floor((decimalHours - hours) * 60);
    
    // Если часы больше 24, это означает следующий день
    let targetDate = dateString;
    if (hours >= 24) {
      const currentDate = new Date(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
      targetDate = currentDate.toISOString().split('T')[0];
      hours = hours % 24; // Остаток от деления на 24
    }
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    return new Date(targetDate + 'T' + timeString);
  }

  /**
   * Получить полную проводку по номеру КА
   */
  async getFullObservation(satelliteNumber: string, date?: string): Promise<any> {
    const whereCondition: any = { satelliteNumber };
    
    if (date) {
      whereCondition.dateObs = new Date(date);
    }

    const observations = await this.observationRepository.find({
      where: whereCondition,
      relations: [
        'coordinates',
        'filters',
        'filters.experiments',
        'filters.spectralPeaks',
        'filters.rawSignals',
        'filters.instrumentalMagnitudes',
        'filters.averagedMagnitudes',
        'filters.summaryStats',
      ],
      order: {
        partitionTimeSeconds: 'ASC',
      },
    });

    if (observations.length === 0) {
      throw new NotFoundException(`Наблюдения для КА ${satelliteNumber} не найдены`);
    }

    return observations;
  }

  /**
   * Преобразует дату из различных форматов в Date объект
   */
  private parseDate(dateString: string): Date {
    // Пробуем формат DD.MM.YYYY
    const ddMmYyyyMatch = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddMmYyyyMatch) {
      const [, day, month, year] = ddMmYyyyMatch;
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    // Пробуем формат YYYY-MM-DD
    const yyyyMmDdMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (yyyyMmDdMatch) {
      const [, year, month, day] = yyyyMmDdMatch;
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    // Пробуем формат DD/MM/YYYY
    const ddMmYyyySlashMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddMmYyyySlashMatch) {
      const [, day, month, year] = ddMmYyyySlashMatch;
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    // Если не удалось распарсить, пробуем стандартный конструктор
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Неверный формат даты: ${dateString}. Ожидается формат DD.MM.YYYY, YYYY-MM-DD или DD/MM/YYYY`);
    }
    return parsedDate;
  }

  /**
   * Получить все партиции наблюдения по номеру КА и дате
   */
  async getObservationPartitions(satelliteNumber: string, date: string): Promise<any[]> {
    const parsedDate = this.parseDate(date);
    
    const observations = await this.observationRepository.find({
      where: {
        satelliteNumber,
        dateObs: parsedDate,
      },
      relations: [
        'coordinates',
        'filters',
        'filters.experiments',
        'filters.spectralPeaks',
        'filters.rawSignals',
        'filters.instrumentalMagnitudes',
        'filters.averagedMagnitudes',
        'filters.summaryStats',
      ],
      order: {
        partitionTimeSeconds: 'ASC',
      },
    });

    return observations;
  }

  /**
   * Получить список всех КА
   */
  async getSatellites(): Promise<any[]> {
    const satellites = await this.observationRepository
      .createQueryBuilder('obs')
      .select('DISTINCT obs.satellite_number', 'satelliteNumber')
      .where('obs.satellite_number IS NOT NULL')
      .orderBy('obs.satellite_number', 'ASC')
      .getRawMany();

    return satellites;
  }
}
