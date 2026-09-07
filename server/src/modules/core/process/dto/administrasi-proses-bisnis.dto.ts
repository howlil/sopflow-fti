import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { LingkupOrganisasi } from '../../../../generated/prisma';

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

export class CreateProsesBisnisDto {
  @ApiProperty({ example: 'Tugas Akhir' })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama!: string;

  @ApiProperty({ enum: LingkupOrganisasi })
  @IsEnum(LingkupOrganisasi)
  scope!: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departemenId?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ type: [String], minItems: 1, description: 'Anggota selain Penanggung Jawab Proses Bisnis' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds!: string[];
}

export class UpdateProsesBisnisDto {
  @ApiPropertyOptional({ example: 'Tugas Akhir' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama?: string;

  @ApiPropertyOptional({ enum: LingkupOrganisasi })
  @IsOptional()
  @IsEnum(LingkupOrganisasi)
  scope?: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departemenId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: [String], minItems: 1, description: 'Anggota selain Penanggung Jawab Proses Bisnis' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
