import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBase64, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { PDF_BASE64_MAX_LENGTH } from '../../../../common/http/request-body-limits';

export class TandaTanganiProsesBisnisSopBulkItemDto {
  @ApiProperty()
  @IsUUID()
  readonly detailSopId!: string;

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

  @ApiProperty({ description: 'PDF hasil renderer SOP sebagai base64 tanpa prefix data URL.' })
  @IsString()
  @IsBase64()
  @MaxLength(PDF_BASE64_MAX_LENGTH)
  readonly pdfBase64!: string;
}

export class TandaTanganiProsesBisnisSopBulkDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  readonly pin!: string;

  @ApiProperty({ type: [TandaTanganiProsesBisnisSopBulkItemDto], maxItems: 20 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TandaTanganiProsesBisnisSopBulkItemDto)
  readonly items!: TandaTanganiProsesBisnisSopBulkItemDto[];
}
