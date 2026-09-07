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
import { LingkupOrganisasi } from '../../../../generated/prisma';
import { CreatePenggunaProfilDto } from '../../pengguna/dto/create-pengguna-profil.dto';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class GrantKewenanganPenanggungJawabProsesBisnisDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  penggunaId!: string;

  @ApiProperty({ enum: LingkupOrganisasi })
  @IsEnum(LingkupOrganisasi)
  lingkup!: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departemenId?: string | null;
}

export class CreateOwnedProsesBisnisDto {
  @ApiProperty({ example: 'Tugas Akhir' })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama!: string;

  @ApiProperty({ enum: LingkupOrganisasi })
  @IsEnum(LingkupOrganisasi)
  lingkup!: LingkupOrganisasi;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID()
  departemenId?: string | null;
}

export class RenameOwnedProsesBisnisDto {
  @ApiProperty({ example: 'Tugas Akhir Mahasiswa' })
  @Transform(trimString)
  @IsString()
  @Length(2, 120)
  nama!: string;
}

export class AddAnggotaProsesBisnisDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  penggunaId!: string;
}

export class InviteAnggotaProsesBisnisDto extends CreatePenggunaProfilDto {}

export class ArchiveOwnedProsesBisnisDto {
  @ApiProperty({ example: 'Proses Bisnis tidak lagi digunakan sejak semester baru' })
  @Transform(trimString)
  @IsString()
  @Length(3, 255)
  reason!: string;
}

export class AcceptUndanganAnggotaProsesBisnisDto {
  @ApiProperty({ minLength: 8, example: 'SandiBaru123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
