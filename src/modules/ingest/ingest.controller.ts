import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IngestService } from './ingest.service';
import { ObservationIngestDto } from './dto/observation-ingest.dto';
import { IngestResultDto } from './dto/ingest-result.dto';

@ApiTags('ingest')
@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, callback) => {
      // Принимаем любые файлы - расширение может быть любым
      // Проверяем только MIME-типы для безопасности
      const allowedMimeTypes = [
        'text/plain',
        'application/octet-stream',
        'text/x-fortran',
        'application/octet-stream',
        'text/csv',
        'application/csv'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype) || !file.mimetype) {
        callback(null, true);
      } else {
        callback(new Error(`Неподдерживаемый MIME-тип файла. Получен: ${file.originalname} (${file.mimetype})`), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Загрузить файл наблюдения' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Файл наблюдения (.E)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Файл успешно обработан', type: IngestResultDto })
  @ApiResponse({ status: 400, description: 'Ошибка парсинга файла' })
  @ApiResponse({ status: 409, description: 'Наблюдение уже существует' })
  @ApiResponse({ status: 500, description: 'Ошибка загрузки файла' })
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<IngestResultDto> {
    if (!file) {
      throw new Error('Файл не был загружен');
    }
    return this.ingestService.ingestFromFile(file);
  }

  @Post('json')
  @ApiOperation({ summary: 'Загрузить данные наблюдения в формате JSON' })
  @ApiBody({ type: ObservationIngestDto })
  @ApiResponse({ status: 201, description: 'Данные успешно сохранены', type: IngestResultDto })
  @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
  @ApiResponse({ status: 409, description: 'Наблюдение уже существует' })
  async ingestJson(@Body() data: ObservationIngestDto): Promise<IngestResultDto> {
    return this.ingestService.ingestFromJson(data);
  }

  @Get('satellite/:satelliteNumber')
  @ApiOperation({ summary: 'Получить полную проводку по номеру КА' })
  @ApiParam({ name: 'satelliteNumber', description: 'Номер космического аппарата' })
  @ApiQuery({ name: 'date', description: 'Дата наблюдения (YYYY-MM-DD)', required: false })
  @ApiResponse({ status: 200, description: 'Полная проводка наблюдения' })
  @ApiResponse({ status: 404, description: 'Наблюдение не найдено' })
  async getFullObservation(
    @Param('satelliteNumber') satelliteNumber: string,
    @Query('date') date?: string,
  ): Promise<any> {
    return this.ingestService.getFullObservation(satelliteNumber, date);
  }

  @Get('satellite/:satelliteNumber/partitions')
  @ApiOperation({ summary: 'Получить все партиции наблюдения КА' })
  @ApiParam({ name: 'satelliteNumber', description: 'Номер космического аппарата' })
  @ApiQuery({ name: 'date', description: 'Дата наблюдения (DD.MM.YYYY, YYYY-MM-DD или DD/MM/YYYY)', required: true })
  @ApiResponse({ status: 200, description: 'Список партиций наблюдения' })
  @ApiResponse({ status: 404, description: 'Наблюдение не найдено' })
  @ApiResponse({ status: 400, description: 'Неверный формат даты' })
  async getObservationPartitions(
    @Param('satelliteNumber') satelliteNumber: string,
    @Query('date') date: string,
  ): Promise<any[]> {
    return this.ingestService.getObservationPartitions(satelliteNumber, date);
  }

  @Get('satellites')
  @ApiOperation({ summary: 'Получить список всех КА' })
  @ApiResponse({ status: 200, description: 'Список всех космических аппаратов' })
  async getSatellites(): Promise<any[]> {
    return this.ingestService.getSatellites();
  }
}
