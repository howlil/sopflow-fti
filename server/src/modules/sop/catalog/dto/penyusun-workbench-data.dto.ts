import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenyusunWorkbenchDetailDto } from './penyusun-workbench-detail.dto';
import { PenyusunWorkbenchLangkahDto } from './penyusun-workbench-langkah.dto';
import { PenyusunWorkbenchLogEditDto } from './penyusun-workbench-log-edit.dto';
import { PenyusunWorkbenchDiagramKonfigurasiDto } from '../../diagram/dto/penyusun-workbench-diagram.dto';
import type { ProsesBisnisSopLifecycleProjection } from '../../penyusunan-proses-bisnis/sop-proses-bisnis-siklus.projection';

class TteSignaturePayloadDto {
  @ApiProperty()
  readonly id!: string;

  @ApiProperty()
  readonly dokumenTteId!: string;

  @ApiProperty()
  readonly userId!: string;

  @ApiProperty()
  readonly nip!: string;

  @ApiProperty()
  readonly namaLengkap!: string;

  @ApiProperty()
  readonly jabatan!: string;

  @ApiProperty()
  readonly signedAt!: string;
}

/** Muatan data GET area kerja penyusun: detail + langkah + activity + signing evidence. */
export class PenyusunWorkbenchDataDto {
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Projection siklus canonical untuk SOP yang terikat Proses Bisnis.',
  })
  readonly siklus?: ProsesBisnisSopLifecycleProjection;

  @ApiProperty({ type: () => PenyusunWorkbenchDetailDto })
  readonly detail!: PenyusunWorkbenchDetailDto;

  @ApiProperty({ type: () => [PenyusunWorkbenchLangkahDto] })
  readonly langkah!: PenyusunWorkbenchLangkahDto[];

  @ApiProperty({ type: () => [PenyusunWorkbenchLogEditDto] })
  readonly logEdit!: PenyusunWorkbenchLogEditDto[];

  @ApiProperty({ type: () => PenyusunWorkbenchDiagramKonfigurasiDto, required: false })
  readonly diagramKonfigurasi?: PenyusunWorkbenchDiagramKonfigurasiDto;

  @ApiProperty({
    type: () => TteSignaturePayloadDto,
    required: false,
    description: 'Bukti tanda tangan elektronik terbaru tanpa vocabulary role legacy.',
  })
  readonly tteSignaturePayload?: TteSignaturePayloadDto;
}
