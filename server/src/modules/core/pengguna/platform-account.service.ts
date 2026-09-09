import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  assertAtLeastOneUpdateField,
  assertEmailNipUniqueOnUpdate,
  hashDefaultPassword,
  requireIndonesianMobileNumber,
  rethrowPrismaUniqueViolation,
  resolveDeletedAtFromStatus,
} from '../../../common/pengguna/pengguna-admin.util';
import type { CreatePlatformAccountDto } from './dto/create-platform-account.dto';
import type { UpdatePenggunaProfilDto } from './dto/update-pengguna-profil.dto';
import { PenggunaRepository, type PlatformAccountRow } from './pengguna.repository';

@Injectable()
export class PlatformAccountService {
  constructor(private readonly penggunaRepository: PenggunaRepository) {}

  list(): Promise<PlatformAccountRow[]> {
    return this.penggunaRepository.listPlatformAccounts();
  }

  async update(penggunaId: string, dto: UpdatePenggunaProfilDto): Promise<PlatformAccountRow> {
    const current = await this.penggunaRepository.findPlatformAccount(penggunaId);
    if (current === null) throw new NotFoundException('Akun FTI tidak ditemukan');
    assertAtLeastOneUpdateField([
      dto.nama,
      dto.email,
      dto.nip,
      dto.jabatan,
      dto.pangkat,
      dto.nohp,
      dto.status,
    ]);

    const email = dto.email === undefined ? undefined : dto.email.trim().toLowerCase();
    const nip = dto.nip === undefined ? undefined : dto.nip.trim();
    await assertEmailNipUniqueOnUpdate(this.penggunaRepository, penggunaId, current, email, nip);

    const deletedAt = resolveDeletedAtFromStatus(dto.status, current.deletedAt);
    if (dto.status === 'NONAKTIF' && current.deletedAt === null) {
      const [ownedProcesses, ownerAuthorities, organizationalAuthorities] = await Promise.all([
        this.penggunaRepository.countActiveOwnedProcesses(penggunaId),
        this.penggunaRepository.countActiveOwnerAuthorities(penggunaId),
        this.penggunaRepository.countActiveOrganizationalAuthorities(penggunaId),
      ]);
      if (ownedProcesses > 0 || ownerAuthorities > 0 || organizationalAuthorities > 0) {
        throw new ConflictException(
          'Akun tidak dapat dinonaktifkan sebelum seluruh Owner dan kewenangan aktif dialihkan atau dicabut',
        );
      }
    }

    try {
      return await this.penggunaRepository.updatePlatformAccount(penggunaId, {
        ...(dto.nama === undefined ? {} : { nama: dto.nama.trim() }),
        ...(email === undefined ? {} : { email }),
        ...(nip === undefined ? {} : { nip }),
        ...(dto.jabatan === undefined ? {} : { jabatan: dto.jabatan.trim() }),
        ...(dto.pangkat === undefined ? {} : { pangkat: dto.pangkat.trim() }),
        ...(dto.nohp === undefined ? {} : { nohp: requireIndonesianMobileNumber(dto.nohp) }),
        deletedAt,
        ...(dto.status === 'NONAKTIF' ? { invalidateSessions: true } : {}),
      });
    } catch (error: unknown) {
      rethrowPrismaUniqueViolation(error);
      throw error;
    }
  }

  async create(dto: CreatePlatformAccountDto): Promise<PlatformAccountRow> {
    const hashedPassword = await hashDefaultPassword();
    try {
      return await this.penggunaRepository.createPlatformAccount({
        email: dto.email.trim().toLowerCase(),
        nama: dto.nama.trim(),
        nip: dto.nip.trim(),
        pangkat: dto.pangkat.trim(),
        jabatan: dto.jabatan.trim(),
        nohp: requireIndonesianMobileNumber(dto.nohp),
        kataSandi: hashedPassword,
      });
    } catch (error: unknown) {
      rethrowPrismaUniqueViolation(error);
      throw error;
    }
  }
}
