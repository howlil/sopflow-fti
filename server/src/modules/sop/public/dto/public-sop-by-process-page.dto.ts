import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedData } from '../../../../common/utils/pagination.util';
import { PublicProcessItemDto } from './public-process-item.dto';
import { PublicSopItemDto } from './public-sop-item.dto';

/** Respons daftar SOP resmi untuk satu Process FTI beserta konteks Process. */
export class PublicSopByProcessPageDto implements PaginatedData<PublicSopItemDto> {
  @ApiProperty({ type: [PublicSopItemDto] })
  readonly items!: PublicSopItemDto[];

  @ApiProperty()
  readonly pagination!: PaginatedData<PublicSopItemDto>['pagination'];

  @ApiProperty({ type: PublicProcessItemDto })
  readonly process!: PublicProcessItemDto;
}
