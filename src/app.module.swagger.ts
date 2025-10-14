import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestModule } from './modules/ingest/ingest.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    IngestModule,
    ObservationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}

