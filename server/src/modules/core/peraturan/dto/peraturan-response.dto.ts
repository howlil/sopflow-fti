import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Ringkas master peraturan global FTI + meta pemakaian SOP. */
export class PeraturanResponseDto {
  @ApiProperty()
  readonly id!: string;

  @ApiProperty()
  readonly namaPeraturan!: string;

  @ApiProperty()
  readonly nomor!: string;

  @ApiProperty()
  readonly tahun!: number;

  @ApiProperty()
  readonly tentang!: string;

  @ApiProperty()
  readonly createdAt!: string;

  @ApiProperty()
  readonly updatedAt!: string;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  readonly lastEditedById?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Pengguna yang terakhir mengubah master peraturan.' })
  readonly lastEditedBy?: { id: string; nama: string } | null;

  @ApiPropertyOptional({ description: 'Jumlah pemakaian sebagai dasar hukum SOP' })
  readonly digunakan?: number;
}
