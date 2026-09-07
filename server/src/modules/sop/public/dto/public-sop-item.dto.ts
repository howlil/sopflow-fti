import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LingkupOrganisasi } from '../../../../generated/prisma';

/** Satu SOP resmi pada arsip publik target-native. */
export class PublicSopItemDto {
  @ApiProperty({ format: 'uuid' })
  readonly detailSopId!: string;

  @ApiProperty({ format: 'uuid' })
  readonly sopId!: string;

  @ApiProperty()
  readonly judul!: string;

  @ApiProperty()
  readonly nomorSOP!: string;

  @ApiProperty()
  readonly versi!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Tanggal efektif pengesahan (ISO 8601)' })
  readonly tanggalEfektif!: string | null;

  @ApiProperty({ format: 'uuid' })
  readonly prosesBisnisId!: string;

  @ApiProperty()
  readonly namaProsesBisnis!: string;

  @ApiProperty({ enum: LingkupOrganisasi })
  readonly lingkup!: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly departemenId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly namaDepartemen!: string | null;

  @ApiProperty({ description: 'URL PDF resmi yang divalidasi server setiap request' })
  readonly pdfUrl!: string;
}
