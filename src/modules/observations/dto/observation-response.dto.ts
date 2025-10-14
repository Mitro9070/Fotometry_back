import { ApiProperty } from '@nestjs/swagger';

export class StationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  latitudeDeg: number;

  @ApiProperty()
  longitudeDeg: number;

  @ApiProperty()
  altitudeM: number;
}

export class ObservationListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  station: StationResponseDto;

  @ApiProperty()
  obsDate: string;

  @ApiProperty()
  obsNumber: string;

  @ApiProperty()
  utcOffsetHours: number;

  @ApiProperty({ type: [String] })
  filters: string[];

  @ApiProperty({ required: false })
  satelliteNumber?: string;
}

export class ObservationDetailDto extends ObservationListItemDto {
  @ApiProperty({ required: false })
  averagingPeriodSec?: number;

  @ApiProperty({ required: false })
  etalonDurationSec?: number;

  @ApiProperty({ required: false })
  etalonSignal?: number;

  @ApiProperty({ required: false })
  sourceFileName?: string;

  @ApiProperty({ required: false })
  sourceSha256?: string;

  @ApiProperty({ type: [Object] })
  coordinates: any[];

  @ApiProperty({ type: [Object] })
  filters: any[];
}

export class PagedResultDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
