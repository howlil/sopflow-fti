import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsString, MaxLength, MinLength } from 'class-validator';
import { PDF_BASE64_MAX_LENGTH } from '../../../../common/http/request-body-limits';

export class TandaTanganiProcessSopDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  readonly pin!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  readonly nomorDokumen!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  readonly judulDokumen!: string;

  @ApiProperty({
    description: 'PDF hasil renderer SOP sebagai base64 tanpa prefix data URL.',
  })
  @IsString()
  @IsBase64()
  @MaxLength(PDF_BASE64_MAX_LENGTH)
  readonly pdfBase64!: string;
}
