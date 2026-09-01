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
import { OrganizationalScope } from '../../../../generated/prisma';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Departemen Teknologi Informasi' })
  @Transform(trimString)
  @IsString()
  @Length(2, 100)
  nama!: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

export class CreateProcessDto {
  @ApiProperty({ example: 'Tugas Akhir' })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama!: string;

  @ApiProperty({ enum: OrganizationalScope })
  @IsEnum(OrganizationalScope)
  scope!: OrganizationalScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departmentId?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ type: [String], minItems: 1, description: 'Anggota selain Process Owner' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds!: string[];
}

export class UpdateProcessDto {
  @ApiPropertyOptional({ example: 'Tugas Akhir' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama?: string;

  @ApiPropertyOptional({ enum: OrganizationalScope })
  @IsOptional()
  @IsEnum(OrganizationalScope)
  scope?: OrganizationalScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: [String], minItems: 1, description: 'Anggota selain Process Owner' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
