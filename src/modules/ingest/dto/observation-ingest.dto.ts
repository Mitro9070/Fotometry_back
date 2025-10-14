import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class StationDto {
  @ApiProperty({ description: 'Код пункта наблюдения' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Широта в градусах' })
  @IsNumber()
  latitudeDeg: number;

  @ApiProperty({ description: 'Долгота в градусах' })
  @IsNumber()
  longitudeDeg: number;

  @ApiProperty({ description: 'Высота в метрах' })
  @IsNumber()
  altitudeM: number;
}

export class EtalonDto {
  @ApiProperty({ description: 'Сигнал эталона' })
  @IsNumber()
  signal: number;

  @ApiProperty({ description: 'Длительность эталона в секундах' })
  @IsNumber()
  durationSec: number;
}

export class CoordinateDto {
  @ApiProperty({ description: 'Часовой угол в градусах' })
  @IsNumber()
  hourAngleDeg: number;

  @ApiProperty({ description: 'Дельта в градусах' })
  @IsNumber()
  deltaDeg: number;

  @ApiProperty({ description: 'Время в десятичных часах' })
  @IsNumber()
  timeLocalDecHours: number;
}

export class FilterExperimentDto {
  @ApiProperty({ description: 'Время начала экспозиции' })
  @IsNumber()
  exposureStart: number;

  @ApiProperty({ description: 'Интервал в минутах' })
  @IsNumber()
  intervalMin: number;

  @ApiProperty({ description: 'Шаг в секундах' })
  @IsNumber()
  stepSec: number;

  @ApiProperty({ description: 'Фон за 30 секунд' })
  @IsNumber()
  background30Sec: number;

  @ApiProperty({ description: 'Количество отсчетов' })
  @IsNumber()
  countNumber: number;
}

export class SpectralPeakDto {
  @ApiProperty({ description: 'Номер пика' })
  @IsNumber()
  peakNumber: number;

  @ApiProperty({ description: 'Амплитуда' })
  @IsNumber()
  amplitude: number;

  @ApiProperty({ description: 'Номер' })
  @IsNumber()
  number: number;

  @ApiProperty({ description: 'Процент' })
  @IsNumber()
  percentage: number;

  @ApiProperty({ description: 'Время в секундах' })
  @IsNumber()
  timeSec: number;
}

export class SummaryStatsDto {
  @ApiProperty({ description: 'Альфа' })
  @IsNumber()
  alpha: number;

  @ApiProperty({ description: 'Зенит' })
  @IsNumber()
  zenith: number;

  @ApiProperty({ description: 'Дельта' })
  @IsNumber()
  delta: number;

  @ApiProperty({ description: 'Азимут' })
  @IsNumber()
  azimuth: number;

  @ApiProperty({ description: 'Часовой угол' })
  @IsNumber()
  hourAngle: number;

  @ApiProperty({ description: 'Фазовый угол' })
  @IsNumber()
  phaseAngle: number;

  @ApiProperty({ description: 'Дискретное время' })
  @IsNumber()
  discreteTime: number;

  @ApiProperty({ description: 'Звездное время' })
  @IsNumber()
  siderealTime: number;

  @ApiProperty({ description: 'Инструментальная звездная величина' })
  @IsNumber()
  instrumentalStarMagnitude: number;
}

export class AveragedMagnitudeDto {
  @ApiProperty({ description: 'Время в десятичных часах' })
  @IsNumber()
  timeLocalDecHours: number;

  @ApiProperty({ description: 'Величина' })
  @IsNumber()
  magnitudeValue: number;
}

export class FilterDto {
  @ApiProperty({ description: 'Код фильтра' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Звездная величина' })
  @IsNumber()
  starMagnitude: number;

  @ApiProperty({ description: 'A-экстинкция' })
  @IsNumber()
  aExt: number;

  @ApiProperty({ description: 'B-экстинкция' })
  @IsNumber()
  bExt: number;

  @ApiProperty({ description: 'Экстинкция' })
  @IsNumber()
  extinction: number;

  @ApiProperty({ description: 'Сигма' })
  @IsNumber()
  sigma: number;

  @ApiProperty({ description: 'Эксперимент фильтра' })
  @ValidateNested()
  @Type(() => FilterExperimentDto)
  experiment: FilterExperimentDto;

  @ApiProperty({ description: 'Спектральные пики', type: [SpectralPeakDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpectralPeakDto)
  spectralPeaks: SpectralPeakDto[];

  @ApiProperty({ description: 'Сырые сигналы', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  rawSignals: number[];

  @ApiProperty({ description: 'Инструментальные величины', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  instrumentalMagnitudes: number[];

  @ApiProperty({ description: 'Усредненные величины', type: [Object] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AveragedMagnitudeDto)
  averagedMagnitudes: AveragedMagnitudeDto[];

  @ApiProperty({ description: 'Сводная статистика' })
  @ValidateNested()
  @Type(() => SummaryStatsDto)
  summaryStats: SummaryStatsDto;
}

export class ObservationIngestDto {
  @ApiProperty({ description: 'Данные станции' })
  @ValidateNested()
  @Type(() => StationDto)
  station: StationDto;

  @ApiProperty({ description: 'Дата наблюдения' })
  @IsDateString()
  obsDate: string;

  @ApiProperty({ description: 'Номер наблюдения' })
  @IsString()
  obsNumber: string;

  @ApiProperty({ description: 'Смещение UTC в часах' })
  @IsNumber()
  utcOffsetHours: number;

  @ApiProperty({ description: 'Период усреднения в секундах', required: false })
  @IsOptional()
  @IsNumber()
  averagingPeriodSec?: number;

  @ApiProperty({ description: 'Данные эталона', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => EtalonDto)
  etalon?: EtalonDto;

  @ApiProperty({ description: 'Координаты', type: [CoordinateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoordinateDto)
  coordinates: CoordinateDto[];

  @ApiProperty({ description: 'Фильтры', type: [FilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  filters: FilterDto[];

  @ApiProperty({ description: 'Номер космического аппарата', required: false })
  @IsOptional()
  @IsString()
  satelliteNumber?: string;

  @ApiProperty({ description: 'Время партиции в секундах', required: false })
  @IsOptional()
  @IsNumber()
  partitionTimeSeconds?: number;
}
