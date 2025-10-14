import { Controller, Get, Delete, Param, Query, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ObservationsService } from './observations.service';
import { ObservationQueryDto } from './dto/observation-query.dto';
import { ObservationListItemDto, ObservationDetailDto, PagedResultDto } from './dto/observation-response.dto';

@ApiTags('Observations - Наблюдения')
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список наблюдений с фильтрацией и пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Список наблюдений',
    type: PagedResultDto<ObservationListItemDto>,
  })
  async getList(@Query() query: ObservationQueryDto): Promise<PagedResultDto<ObservationListItemDto>> {
    return this.observationsService.getList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о наблюдении' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiQuery({ name: 'includeSeries', required: false, description: 'Включить временные ряды', type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Детальная информация о наблюдении',
    type: ObservationDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Наблюдение не найдено' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ObservationDetailDto> {
    return this.observationsService.getById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить наблюдение' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiResponse({ status: 200, description: 'Наблюдение удалено' })
  @ApiResponse({ status: 404, description: 'Наблюдение не найдено' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.observationsService.delete(id);
  }

  @Get(':id/coordinates')
  @ApiOperation({ summary: 'Получить координаты наблюдения' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiResponse({
    status: 200,
    description: 'Координаты наблюдения',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          hourAngle: { type: 'number' },
          deltaDeg: { type: 'number' },
          timeLocalDecHours: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Координаты не найдены' })
  async getCoordinates(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.observationsService.getCoordinates(id);
  }

  @Get(':id/filters')
  @ApiOperation({ summary: 'Получить список фильтров наблюдения' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiResponse({
    status: 200,
    description: 'Список фильтров',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          code: { type: 'string' },
          magnitude: { type: 'number' },
          samples: { type: 'number' },
        },
      },
    },
  })
  async getFilters(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    const observation = await this.observationsService.getById(id);
    return observation.filters.map(f => ({
      code: f.code,
      magnitude: f.magnitude,
    }));
  }

  @Get(':id/filters/:code')
  @ApiOperation({ summary: 'Получить информацию о конкретном фильтре' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiParam({ name: 'code', description: 'Код фильтра (B, V, R, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Информация о фильтре',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        code: { type: 'string' },
        magnitude: { type: 'number' },
        exposure: { type: 'object' },
        skyAtStart: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Фильтр не найден' })
  async getFilter(@Param('id', ParseIntPipe) id: number, @Param('code') code: string): Promise<any> {
    return this.observationsService.getFilterData(id, code);
  }

  @Get(':id/filters/:code/series')
  @ApiOperation({ summary: 'Получить временные ряды для фильтра' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiParam({ name: 'code', description: 'Код фильтра' })
  @ApiQuery({ name: 'type', required: false, description: 'Тип данных: signal, magnitude, averaged', enum: ['signal', 'magnitude', 'averaged'] })
  @ApiResponse({
    status: 200,
    description: 'Временные ряды',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idx: { type: 'number' },
          value: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Данные не найдены' })
  async getFilterSeries(
    @Param('id', ParseIntPipe) id: number,
    @Param('code') code: string,
    @Query('type') type: 'signal' | 'magnitude' | 'averaged' = 'signal',
  ): Promise<any> {
    const filterData = await this.observationsService.getFilterData(id, code);
    
    switch (type) {
      case 'signal':
        return filterData.signals;
      case 'magnitude':
        return filterData.magnitudes;
      case 'averaged':
        return filterData.magnitudeAverages;
      default:
        return filterData.signals;
    }
  }

  @Get(':id/filters/:code/spectra')
  @ApiOperation({ summary: 'Получить спектральные пики для фильтра' })
  @ApiParam({ name: 'id', description: 'ID наблюдения' })
  @ApiParam({ name: 'code', description: 'Код фильтра' })
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
          no: { type: 'number' },
          percentile: { type: 'number' },
          periodSec: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Данные не найдены' })
  async getSpectralPeaks(
    @Param('id', ParseIntPipe) id: number,
    @Param('code') code: string,
  ): Promise<any[]> {
    return this.observationsService.getSpectralPeaks(id, code);
  }
}
