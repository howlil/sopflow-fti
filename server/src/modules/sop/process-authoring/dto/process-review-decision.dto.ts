import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  catatan?: string;
}
