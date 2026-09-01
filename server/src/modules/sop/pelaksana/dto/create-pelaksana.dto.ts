import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePelaksanaDto {
  @ApiProperty({ description: 'Nama actor/pelaksana global yang dapat digunakan ulang' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(15)
  readonly namaPelaksana!: string;
}
