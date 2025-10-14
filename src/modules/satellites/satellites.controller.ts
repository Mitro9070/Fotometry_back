import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SatellitesService } from './satellites.service';
import { SatellitePositionCalculator } from '../../utils/satellite-position';

@ApiTags('Satellites')
@Controller('satellites')
export class SatellitesController {
  constructor(private readonly satellitesService: SatellitesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех спутников' })
  @ApiResponse({ status: 200, description: 'Список спутников получен успешно' })
  async getAllSatellites() {
    const satellites = await this.satellitesService.getAllSatellites();
    return {
      data: satellites,
      total: satellites.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить информацию о спутнике по ID' })
  @ApiParam({ name: 'id', description: 'ID спутника' })
  @ApiResponse({ status: 200, description: 'Информация о спутнике получена успешно' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async getSatelliteById(@Param('id') id: string) {
    const satellite = await this.satellitesService.getSatelliteById(parseInt(id));
    if (!satellite) {
      return { error: 'Спутник не найден' };
    }
    return satellite;
  }

  @Post('fetch/:noradId')
  @ApiOperation({ summary: 'Получить данные спутника из каталога NORAD' })
  @ApiParam({ name: 'noradId', description: 'NORAD ID спутника' })
  @ApiResponse({ status: 201, description: 'Данные спутника получены и сохранены' })
  async fetchSatelliteData(@Param('noradId') noradId: string) {
    try {
      const satellite = await this.satellitesService.createOrUpdateFromNorad(noradId);
      return {
        success: true,
        message: 'Данные спутника успешно получены и сохранены',
        satellite,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при получении данных спутника',
        error: error.message,
      };
    }
  }

  @Get('norad/:noradId')
  @ApiOperation({ summary: 'Найти спутник по NORAD ID' })
  @ApiParam({ name: 'noradId', description: 'NORAD ID спутника' })
  @ApiResponse({ status: 200, description: 'Спутник найден' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async getSatelliteByNoradId(@Param('noradId') noradId: string) {
    const satellite = await this.satellitesService.findByNoradId(noradId);
    if (!satellite) {
      return { error: 'Спутник не найден в базе данных' };
    }
    return satellite;
  }

  @Post(':id/update-tle')
  @ApiOperation({ summary: 'Обновить TLE данные спутника' })
  @ApiParam({ name: 'id', description: 'ID спутника' })
  @ApiResponse({ status: 200, description: 'TLE данные обновлены успешно' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async updateTleData(@Param('id') id: string) {
    try {
      const satellite = await this.satellitesService.updateTleData(+id);
      if (!satellite) {
        return { error: 'Спутник не найден или не удалось обновить TLE данные' };
      }
      return {
        success: true,
        message: 'TLE данные успешно обновлены',
        satellite,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при обновлении TLE данных',
        error: error.message,
      };
    }
  }

  @Get(':id/position')
  @ApiOperation({ summary: 'Рассчитать текущее положение спутника' })
  @ApiParam({ name: 'id', description: 'ID спутника' })
  @ApiQuery({ name: 'time', description: 'Время для расчета (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Положение спутника рассчитано' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async getSatellitePosition(
    @Param('id') id: string,
    @Query('time') time?: string
  ) {
    try {
      const satellite = await this.satellitesService.getSatelliteById(+id);
      if (!satellite) {
        return { error: 'Спутник не найден' };
      }

      if (!satellite.tleLine1 || !satellite.tleLine2 || !satellite.tleEpoch) {
        return { error: 'TLE данные недоступны для этого спутника' };
      }

      const calculationTime = time ? new Date(time) : new Date();
      
      const position = SatellitePositionCalculator.calculatePosition(
        {
          line1: satellite.tleLine1,
          line2: satellite.tleLine2,
          epoch: satellite.tleEpoch,
        },
        calculationTime
      );

      return {
        success: true,
        satellite: {
          id: satellite.id,
          name: satellite.satelliteName,
          noradId: satellite.noradId,
        },
        position,
        calculationTime: calculationTime.toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при расчете положения спутника',
        error: error.message,
      };
    }
  }

  @Get(':id/visibility')
  @ApiOperation({ summary: 'Рассчитать видимость спутника с точки наблюдения' })
  @ApiParam({ name: 'id', description: 'ID спутника' })
  @ApiQuery({ name: 'lat', description: 'Широта наблюдателя', required: true })
  @ApiQuery({ name: 'lon', description: 'Долгота наблюдателя', required: true })
  @ApiQuery({ name: 'alt', description: 'Высота наблюдателя (км)', required: false })
  @ApiQuery({ name: 'time', description: 'Время для расчета (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Видимость рассчитана' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async getSatelliteVisibility(
    @Param('id') id: string,
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('alt') alt?: string,
    @Query('time') time?: string
  ) {
    try {
      const satellite = await this.satellitesService.getSatelliteById(+id);
      if (!satellite) {
        return { error: 'Спутник не найден' };
      }

      if (!satellite.tleLine1 || !satellite.tleLine2 || !satellite.tleEpoch) {
        return { error: 'TLE данные недоступны для этого спутника' };
      }

      const calculationTime = time ? new Date(time) : new Date();
      
      const position = SatellitePositionCalculator.calculatePosition(
        {
          line1: satellite.tleLine1,
          line2: satellite.tleLine2,
          epoch: satellite.tleEpoch,
        },
        calculationTime
      );

      const visibility = SatellitePositionCalculator.calculateVisibility(
        position,
        parseFloat(lat),
        parseFloat(lon),
        alt ? parseFloat(alt) : 0
      );

      return {
        success: true,
        satellite: {
          id: satellite.id,
          name: satellite.satelliteName,
          noradId: satellite.noradId,
        },
        observer: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          altitude: alt ? parseFloat(alt) : 0,
        },
        position,
        visibility,
        calculationTime: calculationTime.toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при расчете видимости спутника',
        error: error.message,
      };
    }
  }
}
