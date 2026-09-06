import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenyusunWorkbenchDiagramKonfigurasiDto } from '../../diagram/dto/penyusun-workbench-diagram.dto';
import { PenyusunWorkbenchDetailDto } from '../../catalog/dto/penyusun-workbench-detail.dto';
import { PenyusunWorkbenchLangkahDto } from '../../catalog/dto/penyusun-workbench-langkah.dto';

/** Dokumen SOP FTI berlaku untuk pratinjau publik (tanpa log audit / workflow compatibility). */
export class PublicSopDokumenDto {
  @ApiProperty({ type: () => PenyusunWorkbenchDetailDto })
  readonly detail!: PenyusunWorkbenchDetailDto;

  @ApiProperty({ type: () => [PenyusunWorkbenchLangkahDto] })
  readonly langkah!: PenyusunWorkbenchLangkahDto[];

  @ApiPropertyOptional({ type: () => PenyusunWorkbenchDiagramKonfigurasiDto })
  readonly diagramKonfigurasi?: PenyusunWorkbenchDiagramKonfigurasiDto;
}
