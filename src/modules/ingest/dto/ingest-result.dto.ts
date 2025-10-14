import { ApiProperty } from '@nestjs/swagger';

export class IngestResultDto {
  @ApiProperty({ description: 'ID созданного наблюдения' })
  observationId: number;

  @ApiProperty({ description: 'Статус операции' })
  status: 'stored' | 'duplicate' | 'error';

  @ApiProperty({ description: 'Является ли дубликатом' })
  duplicates: boolean;

  @ApiProperty({ description: 'Предупреждения', type: [String] })
  warnings: string[];
}
