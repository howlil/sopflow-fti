import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDepartemenDto {
  @ApiProperty({ example: 'Departemen Teknologi Informasi' })
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  nama!: string;
}

export class UpdateDepartemenDto extends PartialType(CreateDepartemenDto) {}
