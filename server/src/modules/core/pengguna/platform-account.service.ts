import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  hashDefaultPassword,
  requireIndonesianMobileNumber,
  rethrowPrismaUniqueViolation,
} from '../../../common/pengguna/pengguna-admin.util';
import type { CreatePlatformAccountDto } from './dto/create-platform-account.dto';
import { PenggunaRepository, type PlatformAccountRow } from './pengguna.repository';

@Injectable()
export class PlatformAccountService {
  constructor(private readonly penggunaRepository: PenggunaRepository) {}

  list(): Promise<PlatformAccountRow[]> {
    return this.penggunaRepository.listPlatformAccounts();
  }

  async create(dto: CreatePlatformAccountDto): Promise<PlatformAccountRow> {
    const compatibilityOpdId = await this.penggunaRepository.findPlatformAdminCompatibilityOpdId();
    if (compatibilityOpdId === null) {
      throw new ServiceUnavailableException(
        'Bootstrap administrator belum memiliki compatibility OPD untuk membuat akun FTI.',
      );
    }

    const hashedPassword = await hashDefaultPassword();
    try {
      return await this.penggunaRepository.createPlatformAccountWithHistory({
        email: dto.email.trim().toLowerCase(),
        nama: dto.nama.trim(),
        nip: dto.nip.trim(),
        pangkat: dto.pangkat.trim(),
        jabatan: dto.jabatan.trim(),
        nohp: requireIndonesianMobileNumber(dto.nohp),
        kataSandi: hashedPassword,
        opdId: compatibilityOpdId,
      });
    } catch (error: unknown) {
      rethrowPrismaUniqueViolation(error);
      throw error;
    }
  }
}
