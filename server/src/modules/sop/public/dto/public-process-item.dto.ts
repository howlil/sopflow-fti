import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationalScope } from '../../../../generated/prisma';

/** Process FTI yang memiliki minimal satu SOP resmi berstatus BERLAKU. */
export class PublicProcessItemDto {
  @ApiProperty({ format: 'uuid' })
  readonly processId!: string;

  @ApiProperty()
  readonly nama!: string;

  @ApiProperty({ enum: OrganizationalScope })
  readonly scope!: OrganizationalScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly departmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly departmentName!: string | null;

  @ApiProperty()
  readonly jumlahSopBerlaku!: number;
}
