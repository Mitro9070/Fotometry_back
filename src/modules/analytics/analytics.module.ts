import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Filter } from '../../entities/filter.entity';
import { SpectralPeak } from '../../entities/spectral-peak.entity';
import { Observation } from '../../entities/observation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Filter,
      SpectralPeak,
      Observation,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
