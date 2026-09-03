import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationalScope } from '../../../../generated/prisma';

/** Satu SOP resmi pada arsip publik; Process context tersedia untuk target-native records. */
export class PublicSopItemDto {
  @ApiProperty({ format: 'uuid' })
  readonly detailSopId!: string;

  @ApiProperty({ format: 'uuid' })
  readonly sopId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, description: 'Legacy compatibility shadow' })
  readonly opdId!: string | null;

  @ApiProperty()
  readonly judul!: string;

  @ApiProperty()
  readonly nomorSOP!: string;

  @ApiProperty()
  readonly versi!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Tanggal efektif pengesahan (ISO 8601)' })
  readonly tanggalEfektif!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Nama OPD compatibility shadow / legacy classification' })
  readonly opdNama!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly processId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly processName!: string | null;

  @ApiPropertyOptional({ enum: OrganizationalScope, nullable: true })
  readonly scope!: OrganizationalScope | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly departmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly departmentName!: string | null;

  @ApiProperty({ description: 'URL PDF resmi yang divalidasi server setiap request' })
  readonly pdfUrl!: string;
}
