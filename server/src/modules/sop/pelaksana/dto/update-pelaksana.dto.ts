import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePelaksanaDto {
  @ApiProperty({ description: 'Nama actor/pelaksana global' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(15)
  readonly namaPelaksana!: string;
}
