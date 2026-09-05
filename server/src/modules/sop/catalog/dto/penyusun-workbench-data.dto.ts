import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenyusunWorkbenchDetailDto } from './penyusun-workbench-detail.dto';
import { PenyusunWorkbenchLangkahDto } from './penyusun-workbench-langkah.dto';
import { PenyusunWorkbenchLogEditDto } from './penyusun-workbench-log-edit.dto';
import { PenyusunWorkbenchDiagramKonfigurasiDto } from '../../diagram/dto/penyusun-workbench-diagram.dto';
import type { ProcessSopLifecycleProjection } from '../../process-authoring/process-sop-lifecycle.projection';

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

/** Muatan data GET area kerja penyusun: detail + semua langkah + log (satu respons). */
export class PenyusunWorkbenchDataDto {
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Projection lifecycle canonical untuk SOP yang terikat Process.',
  })
  readonly lifecycle?: ProcessSopLifecycleProjection;

  @ApiProperty({ type: () => PenyusunWorkbenchDetailDto })
  readonly detail!: PenyusunWorkbenchDetailDto;

  @ApiProperty({
    type: () => [PenyusunWorkbenchLangkahDto],
    description: 'Semua langkah prosedur berurutan; tidak dipaginasi.',
  })
  readonly langkah!: PenyusunWorkbenchLangkahDto[];

  @ApiProperty({ type: () => [PenyusunWorkbenchLogEditDto] })
  readonly logEdit!: PenyusunWorkbenchLogEditDto[];

  @ApiProperty({ type: () => PenyusunWorkbenchDiagramKonfigurasiDto, required: false })
  readonly diagramKonfigurasi?: PenyusunWorkbenchDiagramKonfigurasiDto;

  @ApiProperty({ type: () => TteSignaturePayloadDto, required: false })
  readonly tteSignaturePayloadKepalaOpd?: TteSignaturePayloadDto;
}
