import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignOrganizationalAuthorityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly penggunaId!: string;
}
