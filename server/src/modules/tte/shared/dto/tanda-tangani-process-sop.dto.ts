import { ApiProperty } from '@nestjs/swagger';
import { IsBase64, IsString, MaxLength } from 'class-validator';
import { PDF_BASE64_MAX_LENGTH } from '../../../../common/http/request-body-limits';
import { TandaTanganiDto } from './tanda-tangani.dto';

export class TandaTanganiProcessSopDto extends TandaTanganiDto {
  @ApiProperty({
    description: 'PDF hasil renderer SOP sebagai base64 tanpa prefix data URL.',
  })
  @IsString()
  @IsBase64()
  @MaxLength(PDF_BASE64_MAX_LENGTH)
  readonly pdfBase64!: string;
}
