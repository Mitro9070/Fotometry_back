import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservationsController } from './observations.controller';
import { ObservationsService } from './observations.service';
import { Observation } from '../../entities/observation.entity';
import { Filter } from '../../entities/filter.entity';
import { Coordinate } from '../../entities/coordinate.entity';
import { FilterExperiment } from '../../entities/filter-experiment.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { RawSignal } from '../../entities/raw-signal.entity';
import { InstrumentalMagnitude } from '../../entities/instrumental-magnitude.entity';
import { AveragedMagnitude } from '../../entities/averaged-magnitude.entity';
import { SummaryStat } from '../../entities/summary-stat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Observation,
      Filter,
      Coordinate,
      FilterExperiment,
      SpectralPeak,
      RawSignal,
      InstrumentalMagnitude,
      AveragedMagnitude,
      SummaryStat,
    ]),
  ],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
