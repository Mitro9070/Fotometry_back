import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observation } from '../../entities/observation.entity';
import { Filter } from '../../entities/filter.entity';
import { Coordinate } from '../../entities/coordinate.entity';
import { FilterExperiment } from '../../entities/filter-experiment.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { RawSignal } from '../../entities/raw-signal.entity';
import { InstrumentalMagnitude } from '../../entities/instrumental-magnitude.entity';
import { AveragedMagnitude } from '../../entities/averaged-magnitude.entity';
import { SummaryStat } from '../../entities/summary-stat.entity';
import { ObservationQueryDto } from './dto/observation-query.dto';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(Observation)
    private observationRepository: Repository<Observation>,
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
    @InjectRepository(Coordinate)
    private coordinateRepository: Repository<Coordinate>,
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
  ) {}

  async getList(query: ObservationQueryDto) {
    const queryBuilder = this.observationRepository.createQueryBuilder('obs')
      .leftJoinAndSelect('obs.filters', 'filters');

    // Применяем фильтры
    if (query.stationCode) {
      queryBuilder.andWhere('obs.pointCode = :stationCode', { stationCode: query.stationCode });
    }

    if (query.dateFrom) {
      queryBuilder.andWhere('obs.dateObs >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      queryBuilder.andWhere('obs.dateObs <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.obsNumber) {
      queryBuilder.andWhere('obs.obsNumber = :obsNumber', { obsNumber: query.obsNumber });
    }

    // Применяем сортировку
    if (query.sortBy) {
      const order = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`obs.${query.sortBy}`, order);
    } else {
      queryBuilder.orderBy('obs.dateObs', 'DESC');
    }

    // Применяем пагинацию
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const [observations, total] = await queryBuilder.getManyAndCount();

    return {
      data: observations.map(obs => ({
        id: obs.id,
        station: {
          id: obs.id,
          code: obs.pointCode,
          latitudeDeg: obs.latitude,
          longitudeDeg: obs.longitude,
          altitudeM: obs.altitude,
        },
        obsDate: obs.dateObs instanceof Date ? obs.dateObs.toISOString().split('T')[0] : new Date(obs.dateObs).toISOString().split('T')[0],
        obsNumber: obs.obsNumber,
        utcOffsetHours: obs.timeOffsetUtc,
        filters: obs.filters?.map(filter => filter.filterCode) || [],
        satelliteNumber: obs.satelliteNumber,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const observation = await this.observationRepository.findOne({
      where: { id },
      relations: ['filters', 'coordinates'],
    });

    if (!observation) {
      throw new NotFoundException(`Наблюдение с ID ${id} не найдено`);
    }

    return {
      id: observation.id,
      station: {
        id: observation.id,
        code: observation.pointCode,
        latitudeDeg: observation.latitude,
        longitudeDeg: observation.longitude,
        altitudeM: observation.altitude,
      },
      obsDate: observation.dateObs instanceof Date ? observation.dateObs.toISOString().split('T')[0] : new Date(observation.dateObs).toISOString().split('T')[0],
      obsNumber: observation.obsNumber,
      utcOffsetHours: observation.timeOffsetUtc,
      averagingPeriodSec: observation.avgPeriod,
      etalonDurationSec: observation.etalonDuration,
      etalonSignal: observation.etalonSignal,
      coordinates: observation.coordinates?.map(coord => ({
        hourAngle: coord.hourAngle,
        deltaDeg: coord.delta,
        timeLocalDecHours: coord.time ? coord.time.getHours() + coord.time.getMinutes() / 60 : null,
      })) || [],
      filters: observation.filters?.map(filter => ({
        code: filter.filterCode,
        magnitude: filter.magnitude,
        aExt: filter.aExt,
        bExt: filter.bExt,
        ext: filter.ext,
        sigma: filter.sigma,
      })) || [],
    };
  }

  async delete(id: number) {
    const observation = await this.observationRepository.findOne({
      where: { id },
    });

    if (!observation) {
      throw new NotFoundException(`Наблюдение с ID ${id} не найдено`);
    }

    await this.observationRepository.remove(observation);
    return { message: 'Наблюдение успешно удалено' };
  }

  async getCoordinates(id: number) {
    const coordinates = await this.coordinateRepository.find({
      where: { observationId: id },
      order: { time: 'ASC' },
    });

    return coordinates.map(coord => ({
      hourAngle: coord.hourAngle,
      deltaDeg: coord.delta,
      timeLocalDecHours: coord.time ? coord.time.getHours() + coord.time.getMinutes() / 60 : null,
    }));
  }

  async getFilterData(id: number, filterCode: string) {
    const filter = await this.filterRepository
      .createQueryBuilder('filter')
      .leftJoinAndSelect('filter.experiments', 'experiments')
      .where('filter.observationId = :id', { id })
      .andWhere('LOWER(filter.filterCode) = LOWER(:filterCode)', { filterCode })
      .getOne();

    if (!filter) {
      throw new NotFoundException(`Фильтр ${filterCode} для наблюдения ${id} не найден`);
    }

    // Загружаем связанные данные отдельными запросами
    const [rawSignals, instrumentalMagnitudes, averagedMagnitudes, spectralPeaks, summaryStats] = await Promise.all([
      this.rawSignalRepository.find({ where: { filterId: filter.id } }),
      this.instrumentalMagnitudeRepository.find({ where: { filterId: filter.id } }),
      this.averagedMagnitudeRepository.find({ where: { filterId: filter.id } }),
      this.spectralPeakRepository.find({ where: { filterId: filter.id } }),
      this.summaryStatRepository.find({ where: { filterId: filter.id } }),
    ]);

    return {
      code: filter.filterCode,
      magnitude: filter.magnitude,
      aExt: filter.aExt,
      bExt: filter.bExt,
      ext: filter.ext,
      sigma: filter.sigma,
      exposure: filter.experiments?.[0] ? {
        startLocalDecHours: filter.experiments[0].startExp,
        intervalMin: filter.experiments[0].intervalMin,
        stepSec: filter.experiments[0].stepSec,
        backgroundPer30Sec: filter.experiments[0].background30s,
        samples: filter.experiments[0].samplesCount,
      } : null,
      signals: rawSignals.map(s => ({ idx: s.indexPos, value: s.value })),
      magnitudes: instrumentalMagnitudes.map(m => ({ idx: m.indexPos, value: m.value })),
      magnitudeAverages: averagedMagnitudes.map(avg => ({
        index: avg.indexPos,
        timeLocalDecHours: avg.time ? avg.time.getHours() + avg.time.getMinutes() / 60 : null,
        magnitude: avg.mag,
        hourAngle: avg.hourAngle,
        alphaHours: avg.alpha,
        deltaDeg: avg.delta,
        zenithDeg: avg.zenith,
        azimuthDeg: avg.azimuth,
        phaseAngleDeg: avg.phaseAngle,
        siderealTimeHours: avg.starTime,
      })),
      spectralPeaks: spectralPeaks.map(peak => ({
        rank: peak.rank,
        amplitude: peak.amplitude,
        no: peak.no,
        percentile: peak.pPercent,
        periodSec: peak.tSec,
      })),
      magnitudeStats: summaryStats[0] ? {
        min: summaryStats[0].magMin,
        max: summaryStats[0].magMax,
        mean: summaryStats[0].magAvg,
      } : null,
    };
  }

  async getSpectralPeaks(id: number, filterCode: string) {
    const filter = await this.filterRepository
      .createQueryBuilder('filter')
      .leftJoinAndSelect('filter.spectralPeaks', 'spectralPeaks')
      .where('filter.observationId = :id', { id })
      .andWhere('LOWER(filter.filterCode) = LOWER(:filterCode)', { filterCode })
      .getOne();

    if (!filter) {
      throw new NotFoundException(`Фильтр ${filterCode} для наблюдения ${id} не найден`);
    }

    return filter.spectralPeaks?.map(peak => ({
      rank: peak.rank,
      amplitude: peak.amplitude,
      no: peak.no,
      percentile: peak.pPercent,
      periodSec: peak.tSec,
    })) || [];
  }
}
