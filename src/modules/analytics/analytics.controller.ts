import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics - Аналитика')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Получить распределение данных по фильтрам' })
  @ApiResponse({
    status: 200,
    description: 'Статистика по фильтрам',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filterCode: { type: 'string' },
          count: { type: 'number' },
          avgMagnitude: { type: 'number' },
          minMagnitude: { type: 'number' },
          maxMagnitude: { type: 'number' },
        },
      },
    },
  })
  async getFilterDistribution(): Promise<any[]> {
    return this.analyticsService.getFilterDistribution();
  }

  @Get('spectra')
  @ApiOperation({ summary: 'Получить пики в спектрах' })
  @ApiQuery({ name: 'filterCode', required: false, description: 'Фильтр для анализа' })
  @ApiResponse({
    status: 200,
    description: 'Спектральные пики',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          amplitude: { type: 'number' },
          percentile: { type: 'number' },
          periodSec: { type: 'number' },
          filterCode: { type: 'string' },
          obsDate: { type: 'string' },
          obsNumber: { type: 'string' },
        },
      },
    },
  })
  async getSpectralPeaks(@Query('filterCode') filterCode?: string): Promise<any[]> {
    return this.analyticsService.getSpectralPeaksByFilter(filterCode);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить общую статистику наблюдений' })
  @ApiResponse({
    status: 200,
    description: 'Общая статистика',
    schema: {
      type: 'object',
      properties: {
        totalObservations: { type: 'number' },
        totalFilters: { type: 'number' },
        totalCoordinates: { type: 'number' },
        stationStats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stationCode: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        dateRange: {
          type: 'object',
          properties: {
            minDate: { type: 'string' },
            maxDate: { type: 'string' },
          },
        },
      },
    },
  })
  async getObservationStats(): Promise<any> {
    return this.analyticsService.getObservationStats();
  }

  @Get('magnitudes')
  @ApiOperation({ summary: 'Получить статистику звездных величин' })
  @ApiQuery({ name: 'filterCode', required: false, description: 'Фильтр для анализа' })
  @ApiResponse({
    status: 200,
    description: 'Статистика звездных величин',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          filterCode: { type: 'string' },
          avgMagnitude: { type: 'number' },
          minMagnitude: { type: 'number' },
          maxMagnitude: { type: 'number' },
          stdDevMagnitude: { type: 'number' },
        },
      },
    },
  })
  async getMagnitudeStats(@Query('filterCode') filterCode?: string): Promise<any[]> {
    return this.analyticsService.getMagnitudeStats(filterCode);
  }
}

