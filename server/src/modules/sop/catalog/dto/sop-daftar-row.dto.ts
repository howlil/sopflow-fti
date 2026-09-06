import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProcessSopLifecycleProjection } from '../../process-authoring/process-sop-lifecycle.projection';
import { SopDaftarVersiSliceDto } from './sop-daftar-versi-slice.dto';
import { TerakhirDieditDto } from './terakhir-diedit.dto';

/** Satu baris daftar SOP Process-native (header + versi DetailSOP terbaru). */
export class SopDaftarRowDto {
  @ApiProperty({ description: 'ID header SOP (sopId)' })
  readonly id!: string;

  @ApiPropertyOptional({ description: 'ID DetailSOP versi terakhir', nullable: true })
  readonly detailSopId!: string | null;

  @ApiProperty()
  readonly judul!: string;

  @ApiPropertyOptional({ description: 'Nomor SOP pada versi terakhir', nullable: true })
  readonly nomorSop!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 2 })
  readonly versi!: number | null;

  @ApiPropertyOptional({ description: 'Nama pembuat versi terakhir', nullable: true })
  readonly pembuat!: string | null;

  @ApiProperty({ type: () => TerakhirDieditDto })
  readonly terakhirDiedit!: TerakhirDieditDto;

  @ApiProperty({ description: 'Status persistence DetailSOP versi terakhir' })
  readonly status!: string;

  @ApiProperty({ description: 'Label lifecycle FTI untuk UI' })
  readonly statusLabel!: string;

  @ApiPropertyOptional({ nullable: true })
  readonly peraturanId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly terakhirDiperbarui!: string | null;

  @ApiPropertyOptional({ type: () => SopDaftarVersiSliceDto, nullable: true })
  readonly versiBerlaku!: SopDaftarVersiSliceDto | null;

  @ApiProperty({ description: 'Versi baru dapat dibuat dari source terminal yang valid' })
  readonly canBuatVersiBaru!: boolean;

  @ApiProperty({
    description:
      'Versi BERLAKU secara lifecycle dapat dicabut bila tidak ada revisi berjalan; kewenangan aktor diverifikasi endpoint revocation secara kontekstual.',
  })
  readonly canCabutSop!: boolean;

  @ApiProperty({ description: 'Draft awal satu-satunya dapat dihapus oleh author yang berwenang' })
  readonly canHapusSopDraft!: boolean;

  @ApiPropertyOptional({
    description: 'Canonical lifecycle projection for native Process SOP work queues',
    nullable: true,
  })
  readonly lifecycle?: ProcessSopLifecycleProjection;
}
