import { ApiProperty } from '@nestjs/swagger';

export class CatalogSatelliteDto {
  @ApiProperty({ description: 'Название спутника из каталога' })
  name: string;

  @ApiProperty({ description: 'NORAD каталожный номер' })
  noradId: string;

  @ApiProperty({ description: 'Международный обозначатель' })
  intlDesignator: string;

  @ApiProperty({ description: 'Первая строка TLE' })
  line1: string;

  @ApiProperty({ description: 'Вторая строка TLE' })
  line2: string;

  @ApiProperty({ description: 'Эпоха (год и день года)' })
  epoch?: string;

  @ApiProperty({ description: 'Наклонение орбиты (градусы)' })
  inclination?: number;

  @ApiProperty({ description: 'Прямое восхождение восходящего узла (градусы)' })
  raan?: number;

  @ApiProperty({ description: 'Эксцентриситет' })
  eccentricity?: number;

  @ApiProperty({ description: 'Аргумент перигея (градусы)' })
  argOfPerigee?: number;

  @ApiProperty({ description: 'Средняя аномалия (градусы)' })
  meanAnomaly?: number;

  @ApiProperty({ description: 'Среднее движение (обороты в день)' })
  meanMotion?: number;
}

export class CatalogSearchResultDto {
  @ApiProperty({ description: 'Всего найдено спутников' })
  total: number;

  @ApiProperty({ description: 'Список найденных спутников', type: [CatalogSatelliteDto] })
  satellites: CatalogSatelliteDto[];
}

