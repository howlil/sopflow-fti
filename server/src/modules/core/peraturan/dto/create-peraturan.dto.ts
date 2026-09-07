import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Input pembuatan peraturan global untuk katalog FTI. */
export class CreatePeraturanDto {
  @ApiProperty({ description: 'Nama peraturan (namaPeraturan)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(500)
  readonly namaPeraturan!: string;

  @ApiProperty({ description: 'Nomor peraturan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly nomor!: string;

  @ApiProperty({ description: 'Tahun peraturan' })
  @IsInt()
  @Min(1900)
  readonly tahun!: number;

  @ApiProperty({ description: 'Tentang' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  readonly tentang!: string;
}
