import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProsesBisnisSopLifecycleProjection } from '../../penyusunan-proses-bisnis/sop-proses-bisnis-siklus.projection';
import { SopDaftarVersiSliceDto } from './sop-daftar-versi-slice.dto';
import { TerakhirDieditDto } from './terakhir-diedit.dto';

/** Satu baris daftar SOP ProsesBisnis-native (header + versi DetailSOP terbaru). */
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

  @ApiProperty({ description: 'Label siklus FTI untuk UI' })
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
      'Versi BERLAKU secara siklus dapat dicabut bila tidak ada revisi berjalan; kewenangan aktor diverifikasi endpoint revocation secara kontekstual.',
  })
  readonly canCabutSop!: boolean;

  @ApiProperty({ description: 'Draft awal satu-satunya dapat dihapus oleh author yang berwenang' })
  readonly canHapusSopDraft!: boolean;

  @ApiPropertyOptional({
    description: 'Canonical siklus projection for native Proses Bisnis SOP work queues',
    nullable: true,
  })
  readonly siklus?: ProsesBisnisSopLifecycleProjection;
}
