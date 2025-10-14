import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Satellite } from '../entities/satellite.entity';
import { Observation } from '../entities/observation.entity';
import { Coordinate } from '../entities/coordinate.entity';
import { Filter } from '../entities/filter.entity';
import { FilterExperiment } from '../entities/filter-experiment.entity';
import { SpectralPeak } from '../entities/spectral-peak.entity';
import { RawSignal } from '../entities/raw-signal.entity';
import { InstrumentalMagnitude } from '../entities/instrumental-magnitude.entity';
import { AveragedMagnitude } from '../entities/averaged-magnitude.entity';
import { SummaryStat } from '../entities/summary-stat.entity';

export const createDataSource = (configService: ConfigService) => {
  return {
    type: 'postgres' as const,
    host: configService.get('DB_HOST', '45.12.73.86'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'viktor9070'),
    password: configService.get('DB_PASSWORD', 'Barracuda1975_333'),
    database: configService.get('DB_DATABASE', 'photometry-root'),
          entities: [
        Satellite,
        Observation,
        Coordinate,
        Filter,
        FilterExperiment,
        SpectralPeak,
        RawSignal,
        InstrumentalMagnitude,
        AveragedMagnitude,
        SummaryStat,
      ],
    synchronize: false,
    logging: configService.get('NODE_ENV') === 'development',
    retryAttempts: 1,
    retryDelay: 1000,
    ssl: false,
    extra: {
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
    },
  };
}
