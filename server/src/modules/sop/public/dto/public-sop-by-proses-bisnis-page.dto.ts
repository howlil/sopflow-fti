import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedData } from '../../../../common/utils/pagination.util';
import { PublicProsesBisnisItemDto } from './public-proses-bisnis-item.dto';
import { PublicSopItemDto } from './public-sop-item.dto';

/** Respons daftar SOP resmi untuk satu Proses Bisnis FTI beserta konteks Proses Bisnis. */
export class PublicSopByProsesBisnisPageDto implements PaginatedData<PublicSopItemDto> {
  @ApiProperty({ type: [PublicSopItemDto] })
  readonly items!: PublicSopItemDto[];

  @ApiProperty()
  readonly pagination!: PaginatedData<PublicSopItemDto>['pagination'];

  @ApiProperty({ type: PublicProsesBisnisItemDto })
  readonly prosesBisnis!: PublicProsesBisnisItemDto;
}
