import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Satellite } from '../../entities/satellite.entity';
import { SatellitesService } from './satellites.service';
import { SatellitesController, SatellitesCatalogController } from './satellites.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Satellite]),
    HttpModule,
  ],
  controllers: [SatellitesCatalogController, SatellitesController],
  providers: [SatellitesService, CatalogService],
  exports: [SatellitesService, CatalogService],
})
export class SatellitesModule {}
