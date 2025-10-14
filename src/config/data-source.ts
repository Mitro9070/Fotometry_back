import { DataSource } from 'typeorm';
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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: '45.12.73.86',
  port: 5432,
  username: 'viktor9070',
  password: 'Barracuda1975_333',
  database: 'photometry-root',
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
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
  ssl: false,
  extra: {
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
  },
});
