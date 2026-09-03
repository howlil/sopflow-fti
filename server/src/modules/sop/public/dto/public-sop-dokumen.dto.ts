import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenyusunWorkbenchDiagramKonfigurasiDto } from '../../diagram/dto/penyusun-workbench-diagram.dto';
import { PenyusunWorkbenchDetailDto } from '../../catalog/dto/penyusun-workbench-detail.dto';
import { PenyusunWorkbenchLangkahDto } from '../../catalog/dto/penyusun-workbench-langkah.dto';

export class PublicOpdRingkasDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly nama!: string;
}

/** Dokumen SOP berlaku untuk pratinjau publik (tanpa log audit / umpan balik evaluasi). */
export class PublicSopDokumenDto {
  @ApiPropertyOptional({ type: () => PublicOpdRingkasDto, nullable: true })
  readonly opd!: PublicOpdRingkasDto | null;

  @ApiProperty({ type: () => PenyusunWorkbenchDetailDto })
  readonly detail!: PenyusunWorkbenchDetailDto;

  @ApiProperty({ type: () => [PenyusunWorkbenchLangkahDto] })
  readonly langkah!: PenyusunWorkbenchLangkahDto[];

  @ApiPropertyOptional({ type: () => PenyusunWorkbenchDiagramKonfigurasiDto })
  readonly diagramKonfigurasi?: PenyusunWorkbenchDiagramKonfigurasiDto;
}
