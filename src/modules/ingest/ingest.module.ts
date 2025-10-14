import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { FileParser } from './file.parser';
import { Observation } from '../../entities/observation.entity';
import { Coordinate } from '../../entities/coordinate.entity';
import { Filter } from '../../entities/filter.entity';
import { FilterExperiment } from '../../entities/filter-experiment.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { RawSignal } from '../../entities/raw-signal.entity';
import { InstrumentalMagnitude } from '../../entities/instrumental-magnitude.entity';
import { AveragedMagnitude } from '../../entities/averaged-magnitude.entity';
import { SummaryStat } from '../../entities/summary-stat.entity';
import { SatellitesModule } from '../satellites/satellites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Observation,
      Coordinate,
      Filter,
      FilterExperiment,
      SpectralPeak,
      RawSignal,
      InstrumentalMagnitude,
      AveragedMagnitude,
      SummaryStat,
    ]),
    SatellitesModule,
  ],
  controllers: [IngestController],
  providers: [IngestService, FileParser],
  exports: [IngestService],
})
export class IngestModule {}
