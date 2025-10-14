import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestModule } from './modules/ingest/ingest.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LogsModule } from './modules/logs/logs.module';
import { SatellitesModule } from './modules/satellites/satellites.module';
import { LoggerModule } from './common/logger/logger.module';
import appConfig from './config/app.config';
import { createDataSource } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createDataSource(configService),
      inject: [ConfigService],
    }),
    IngestModule,
    ObservationsModule,
    AnalyticsModule,
    LogsModule,
    SatellitesModule,
  ],
})
export class AppModule {}
