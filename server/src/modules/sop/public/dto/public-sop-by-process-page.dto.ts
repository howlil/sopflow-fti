import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedData } from '../../../../common/utils/pagination.util';
import { PublicProsesBisnisItemDto } from './public-process-item.dto';
import { PublicSopItemDto } from './public-sop-item.dto';

/** Respons daftar SOP resmi untuk satu ProsesBisnis FTI beserta konteks ProsesBisnis. */
export class PublicSopByProsesBisnisPageDto implements PaginatedData<PublicSopItemDto> {
  @ApiProperty({ type: [PublicSopItemDto] })
  readonly items!: PublicSopItemDto[];

  @ApiProperty()
  readonly pagination!: PaginatedData<PublicSopItemDto>['pagination'];

  @ApiProperty({ type: PublicProsesBisnisItemDto })
  readonly process!: PublicProsesBisnisItemDto;
}
