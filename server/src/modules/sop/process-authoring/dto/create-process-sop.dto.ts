import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProcessSopDto {
  @ApiProperty({ description: 'Process yang menjadi owner kontekstual SOP' })
  @IsUUID()
  readonly processId!: string;

  @ApiProperty({ description: 'Judul SOP' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(500)
  readonly judul!: string;

  @ApiProperty({ description: 'Nomor SOP versi pertama (unik global)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  readonly nomorSop!: string;

  @ApiPropertyOptional({ description: 'Nama lembaga pada dokumen' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly namaLembaga?: string;
}
