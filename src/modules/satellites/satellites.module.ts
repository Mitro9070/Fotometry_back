import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Satellite } from '../../entities/satellite.entity';
import { SatellitesService } from './satellites.service';
import { SatellitesController } from './satellites.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Satellite]),
    HttpModule,
  ],
  controllers: [SatellitesController],
  providers: [SatellitesService],
  exports: [SatellitesService],
})
export class SatellitesModule {}
