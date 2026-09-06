import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsUUID,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { OrganizationalScope } from '../../../../generated/prisma';
import { CreatePenggunaProfilDto } from '../../pengguna/dto/create-pengguna-profil.dto';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class GrantProcessOwnerAuthorityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  penggunaId!: string;

  @ApiProperty({ enum: OrganizationalScope })
  @IsEnum(OrganizationalScope)
  scope!: OrganizationalScope;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departmentId?: string | null;
}

export class CreateOwnedProcessDto {
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
}

export class RenameOwnedProcessDto {
  @ApiProperty({ example: 'Tugas Akhir Mahasiswa' })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama!: string;
}

export class AddProcessMemberDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  penggunaId!: string;
}

export class InviteProcessMemberDto extends CreatePenggunaProfilDto {}

export class ArchiveOwnedProcessDto {
  @ApiProperty({ example: 'Process tidak lagi digunakan sejak semester baru' })
  @Transform(trimString)
  @IsString()
  @Length(3, 255)
  reason!: string;
}

export class AcceptProcessInvitationDto {
  @ApiProperty({ minLength: 8, example: 'SandiBaru123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
