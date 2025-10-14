import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from '../../entities/filter.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { Observation } from '../../entities/observation.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
    @InjectRepository(SpectralPeak)
    private spectralPeakRepository: Repository<SpectralPeak>,
    @InjectRepository(Observation)
    private observationRepository: Repository<Observation>,
  ) {}

  async getFilterDistribution(): Promise<any> {
    const result = await this.filterRepository
      .createQueryBuilder('filter')
      .select('filter.filterCode', 'filterCode')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(filter.magnitude)', 'avgMagnitude')
      .addSelect('MIN(filter.magnitude)', 'minMagnitude')
      .addSelect('MAX(filter.magnitude)', 'maxMagnitude')
      .groupBy('filter.filterCode')
      .getRawMany();

    return result.map(item => ({
      filterCode: item.filterCode,
      count: parseInt(item.count),
      avgMagnitude: parseFloat(item.avgMagnitude) || null,
      minMagnitude: parseFloat(item.minMagnitude) || null,
      maxMagnitude: parseFloat(item.maxMagnitude) || null,
    }));
  }

  async getSpectralPeaksByFilter(filterCode?: string): Promise<any> {
    const queryBuilder = this.spectralPeakRepository
      .createQueryBuilder('peak')
      .leftJoinAndSelect('peak.filter', 'filter')
      .leftJoinAndSelect('filter.observation', 'observation')
      .select([
        'peak.rank',
        'peak.amplitude',
        'peak.percentile',
        'peak.periodSec',
        'filter.filterCode',
        'observation.dateObs',
        'observation.obsNumber',
      ]);

    if (filterCode) {
      queryBuilder.where('filter.filterCode = :filterCode', { filterCode });
    }

    const peaks = await queryBuilder
      .orderBy('peak.amplitude', 'DESC')
      .limit(100)
      .getMany();

    return peaks.map(peak => ({
      rank: peak.rank,
      amplitude: peak.amplitude,
      percentile: peak.pPercent,
      periodSec: peak.tSec,
      filterCode: peak.filter.filterCode,
      obsDate: peak.filter.observation.dateObs.toISOString().split('T')[0],
      obsNumber: peak.filter.observation.obsNumber,
    }));
  }

  async getObservationStats(): Promise<any> {
    const totalObservations = await this.observationRepository.count();
    const totalFilters = await this.filterRepository.count();
    const totalCoordinates = await this.observationRepository
      .createQueryBuilder('obs')
      .leftJoin('obs.coordinates', 'coord')
      .getCount();

    const stationStats = await this.observationRepository
      .createQueryBuilder('obs')
      .select('obs.pointCode', 'stationCode')
      .addSelect('COUNT(*)', 'count')
      .groupBy('obs.pointCode')
      .orderBy('count', 'DESC')
      .getRawMany();

    const dateRange = await this.observationRepository
      .createQueryBuilder('obs')
      .select('MIN(obs.obsDate)', 'minDate')
      .addSelect('MAX(obs.obsDate)', 'maxDate')
      .getRawOne();

    return {
      totalObservations,
      totalFilters,
      totalCoordinates,
      stationStats: stationStats.map(stat => ({
        stationCode: stat.stationCode,
        count: parseInt(stat.count),
      })),
      dateRange: {
        minDate: dateRange.minDate,
        maxDate: dateRange.maxDate,
      },
    };
  }

  async getMagnitudeStats(filterCode?: string): Promise<any> {
    const queryBuilder = this.filterRepository
      .createQueryBuilder('filter')
      .select([
        'filter.filterCode',
        'AVG(filter.magnitude)',
        'MIN(filter.magnitude)',
        'MAX(filter.magnitude)',
        'STDDEV(filter.magnitude)',
      ])
      .where('filter.magnitude IS NOT NULL');

    if (filterCode) {
      queryBuilder.andWhere('filter.filterCode = :filterCode', { filterCode });
    }

    const result = await queryBuilder
      .groupBy('filter.filterCode')
      .getRawMany();

    return result.map(item => ({
      filterCode: item.filterCode,
      avgMagnitude: parseFloat(item.avgMagnitude) || null,
      minMagnitude: parseFloat(item.minMagnitude) || null,
      maxMagnitude: parseFloat(item.maxMagnitude) || null,
      stdDevMagnitude: parseFloat(item.stdDevMagnitude) || null,
    }));
  }
}
