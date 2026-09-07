import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignPejabatBerwenangDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly penggunaId!: string;
}
