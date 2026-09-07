import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Satu entri jalur pelaksana (DetailSOPPelaksana). Urutan diturunkan dari posisi index
 * di array `pelaksana[]` muatan data.
 */
export class PelaksanaPatchItem {
  @ApiProperty({
    description: 'ID master Pelaksana global yang dipilih untuk SOP',
    format: 'uuid',
  })
  @IsUUID('4')
  readonly pelaksanaId!: string;
}
