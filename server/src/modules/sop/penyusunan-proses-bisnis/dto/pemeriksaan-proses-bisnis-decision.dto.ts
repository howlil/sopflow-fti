import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export enum KeputusanPemeriksaanProsesBisnis {
  REVISION = 'REVISION',
  ACCEPT = 'ACCEPT',
}

export class KeputusanPemeriksaanProsesBisnisDto {
  @ApiProperty({ enum: KeputusanPemeriksaanProsesBisnis })
  @IsEnum(KeputusanPemeriksaanProsesBisnis)
  decision!: KeputusanPemeriksaanProsesBisnis;

  @ApiPropertyOptional({
    description: 'Catatan perbaikan; wajib diisi ketika keputusan REVISION.',
    maxLength: 5000,
  })
  @ValidateIf(
    (dto: KeputusanPemeriksaanProsesBisnisDto) =>
      dto.decision === KeputusanPemeriksaanProsesBisnis.REVISION || dto.catatan !== undefined,
  )
  @IsString()
  @Matches(/\S/, { message: 'Catatan perbaikan wajib diisi ketika keputusan REVISION' })
  @MaxLength(5000)
  catatan?: string;
}
