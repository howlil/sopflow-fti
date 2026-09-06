import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationalScope } from '../../../../generated/prisma';

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
  readonly processId!: string;

  @ApiProperty()
  readonly processName!: string;

  @ApiProperty({ enum: OrganizationalScope })
  readonly scope!: OrganizationalScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly departmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly departmentName!: string | null;

  @ApiProperty({ description: 'URL PDF resmi yang divalidasi server setiap request' })
  readonly pdfUrl!: string;
}
