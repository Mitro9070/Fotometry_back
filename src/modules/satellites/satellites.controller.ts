import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SatellitesService } from './satellites.service';
import { CatalogService } from './catalog.service';
import { SatellitePositionCalculator } from '../../utils/satellite-position';

@ApiTags('Satellites - Каталог')
@Controller('satellites/catalog')
export class SatellitesCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search')
  @ApiOperation({ 
    summary: 'Поиск спутников в каталоге TLE',
    description: 'Поиск по названию спутника или NORAD номеру (минимум 3 символа)'
  })
  @ApiQuery({ 
    name: 'query', 
    description: 'Название спутника или NORAD ID (минимум 3 символа)',
    example: 'ISS'
  })
  @ApiResponse({ status: 200, description: 'Результаты поиска в каталоге' })
  async searchCatalog(@Query('query') query: string) {
    if (!query || query.length < 3) {
      return {
        success: false,
        message: 'Запрос должен содержать минимум 3 символа',
        total: 0,
        satellites: [],
      };
    }

    const result = this.catalogService.searchSatellites(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':noradId')
  @ApiOperation({ 
    summary: 'Получить детальную информацию по NORAD ID из каталога',
    description: 'Возвращает TLE данные и орбитальные параметры из каталога'
  })
  @ApiParam({ name: 'noradId', description: 'NORAD ID спутника', example: '25544' })
  @ApiResponse({ status: 200, description: 'Детальная информация о спутнике из каталога' })
  @ApiResponse({ status: 404, description: 'Спутник не найден в каталоге' })
  async getCatalogSatelliteByNorad(@Param('noradId') noradId: string) {
    try {
      const satellite = this.catalogService.getSatelliteByNoradId(noradId);
      return {
        success: true,
        satellite,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

@ApiTags('Satellites - База данных')
@Controller('satellites')
export class SatellitesController {
  constructor(
    private readonly satellitesService: SatellitesService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Получить список всех спутников из БД',
    description: 'Возвращает спутники, сохраненные в базе данных'
  })
  @ApiResponse({ status: 200, description: 'Список спутников получен успешно' })
  async getAllSatellites() {
    const satellites = await this.satellitesService.getAllSatellites();
    return {
      success: true,
      data: satellites,
      total: satellites.length,
    };
  }

  @Get('norad/:noradId')
  @ApiOperation({ 
    summary: 'Найти спутник в БД по NORAD ID',
    description: 'Поиск спутника в базе данных по NORAD номеру'
  })
  @ApiParam({ name: 'noradId', description: 'NORAD ID спутника', example: '25544' })
  @ApiResponse({ status: 200, description: 'Спутник найден в БД' })
  @ApiResponse({ status: 404, description: 'Спутник не найден в БД' })
  async getSatelliteByNoradId(@Param('noradId') noradId: string) {
    const satellite = await this.satellitesService.findByNoradId(noradId);
    if (!satellite) {
      return { 
        success: false,
        error: 'Спутник не найден в базе данных' 
      };
    }
    return {
      success: true,
      satellite,
    };
  }

  @Post('norad/:noradId/sync')
  @ApiOperation({ 
    summary: 'Синхронизировать спутник с внешними источниками',
    description: 'Получить/обновить данные спутника из внешних каталогов (N2YO, Celestrak)'
  })
  @ApiParam({ name: 'noradId', description: 'NORAD ID спутника' })
  @ApiResponse({ status: 201, description: 'Данные спутника синхронизированы' })
  async syncSatelliteData(@Param('noradId') noradId: string) {
    try {
      const satellite = await this.satellitesService.createOrUpdateFromNorad(noradId);
      return {
        success: true,
        message: 'Данные спутника успешно синхронизированы',
        satellite,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка при синхронизации данных спутника',
        error: error.message,
      };
    }
  }

  @Get(':id/position')
  @ApiOperation({ 
    summary: 'Рассчитать положение спутника',
    description: 'Расчет текущего положения спутника на орбите на основе TLE данных'
  })
  @ApiParam({ name: 'id', description: 'ID спутника в БД' })
  @ApiQuery({ name: 'time', description: 'Время для расчета (ISO string)', required: false })
  @ApiResponse({ status: 200, description: 'Положение спутника рассчитано' })
  @ApiResponse({ status: 404, description: 'Спутник не найден или нет TLE данных' })
  async getSatellitePosition(
    @Param('id') id: string,
    @Query('time') time?: string
  ) {
    try {
      const satellite = await this.satellitesService.getSatelliteById(+id);
      if (!satellite) {
        return { 
          success: false,
          error: 'Спутник не найден' 
        };
      }

      if (!satellite.tleLine1 || !satellite.tleLine2 || !satellite.tleEpoch) {
        return { 
          success: false,
          error: 'TLE данные недоступны для этого спутника' 
        };
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
  @ApiOperation({ 
    summary: 'Рассчитать видимость спутника',
    description: 'Расчет видимости спутника с точки наблюдения на Земле'
  })
  @ApiParam({ name: 'id', description: 'ID спутника в БД' })
  @ApiQuery({ name: 'lat', description: 'Широта наблюдателя (градусы)', required: true })
  @ApiQuery({ name: 'lon', description: 'Долгота наблюдателя (градусы)', required: true })
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
        return { 
          success: false,
          error: 'Спутник не найден' 
        };
      }

      if (!satellite.tleLine1 || !satellite.tleLine2 || !satellite.tleEpoch) {
        return { 
          success: false,
          error: 'TLE данные недоступны для этого спутника' 
        };
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

  @Get(':id')
  @ApiOperation({ 
    summary: 'Получить информацию о спутнике по ID',
    description: 'Детальная информация о спутнике из базы данных'
  })
  @ApiParam({ name: 'id', description: 'ID спутника в БД' })
  @ApiResponse({ status: 200, description: 'Информация о спутнике получена успешно' })
  @ApiResponse({ status: 404, description: 'Спутник не найден' })
  async getSatelliteById(@Param('id') id: string) {
    const satellite = await this.satellitesService.getSatelliteById(parseInt(id));
    if (!satellite) {
      return { 
        success: false,
        error: 'Спутник не найден' 
      };
    }
    return {
      success: true,
      satellite,
    };
  }
}
