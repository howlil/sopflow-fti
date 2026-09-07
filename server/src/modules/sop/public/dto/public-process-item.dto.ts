import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LingkupOrganisasi } from '../../../../generated/prisma';

/** ProsesBisnis FTI yang memiliki minimal satu SOP resmi berstatus BERLAKU. */
export class PublicProsesBisnisItemDto {
  @ApiProperty({ format: 'uuid' })
  readonly prosesBisnisId!: string;

  @ApiProperty()
  readonly nama!: string;

  @ApiProperty({ enum: LingkupOrganisasi })
  readonly scope!: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly departemenId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly namaDepartemen!: string | null;

  @ApiProperty()
  readonly jumlahSopBerlaku!: number;
}
