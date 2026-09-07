import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LingkupOrganisasi } from '../../../generated/prisma';
import type {
  CreateDepartemenDto,
  CreateProsesBisnisDto,
  UpdateDepartemenDto,
  UpdateProsesBisnisDto,
} from './dto/administrasi-proses-bisnis.dto';
import { ProsesBisnisRepository } from './proses-bisnis.repository';

@Injectable()
export class ProsesBisnisService {
  constructor(private readonly repositoriProsesBisnis: ProsesBisnisRepository) {}

  listDepartemen() {
    return this.repositoriProsesBisnis.listDepartemen();
  }

  async createDepartemen(dto: CreateDepartemenDto) {
    try {
      return await this.repositoriProsesBisnis.createDepartemen(dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Nama departemen sudah digunakan');
    }
  }

  async updateDepartemen(departemenId: string, dto: UpdateDepartemenDto) {
    if (dto.nama === undefined) {
      throw new BadRequestException('Tidak ada perubahan departemen');
    }
    try {
      return await this.repositoriProsesBisnis.updateDepartemen(departemenId, dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Departemen tidak ditemukan atau nama sudah digunakan');
    }
  }

  listAssignableUsers(search?: string) {
    return this.repositoriProsesBisnis.listAssignableUsers(search);
  }

  listProsesBisnis() {
    return this.repositoriProsesBisnis.listProsesBisnis();
  }

  async createProsesBisnis(dto: CreateProsesBisnisDto) {
    const anggotaIds = this.normalizeMemberIds(dto.anggotaIds);
    const departemenId = await this.resolveDepartemen(dto.lingkup, dto.departemenId);
    await this.assertTeam(dto.penanggungJawabId, anggotaIds);

    return this.repositoriProsesBisnis.createProsesBisnis({
      nama: dto.nama.trim(),
      lingkup: dto.lingkup,
      departemenId,
      penanggungJawabId: dto.penanggungJawabId,
      anggotaIds,
    });
  }

  async updateProsesBisnis(prosesBisnisId: string, dto: UpdateProsesBisnisDto) {
    const current = await this.repositoriProsesBisnis.findProsesBisnisById(prosesBisnisId);
    if (current === null) {
      throw new NotFoundException('Proses Bisnis tidak ditemukan');
    }

    const lingkup = dto.lingkup ?? current.lingkup;
    const requestedDepartemen =
      dto.departemenId !== undefined
        ? dto.departemenId
        : dto.lingkup === LingkupOrganisasi.FACULTY
          ? null
          : current.departemenId;
    const departemenId = await this.resolveDepartemen(lingkup, requestedDepartemen);
    const penanggungJawabId = dto.penanggungJawabId ?? current.penanggungJawabId;
    const anggotaIds = this.normalizeMemberIds(
      dto.anggotaIds ?? current.anggota.map((anggota) => anggota.penggunaId),
    );

    await this.assertTeam(penanggungJawabId, anggotaIds);

    return this.repositoriProsesBisnis.updateProsesBisnis(prosesBisnisId, {
      nama: dto.nama?.trim() ?? current.nama,
      lingkup,
      departemenId,
      penanggungJawabId,
      anggotaIds,
    });
  }

  private normalizeMemberIds(anggotaIds: string[]): string[] {
    const unique = [...new Set(anggotaIds)];
    if (unique.length < 1) {
      throw new BadRequestException('Proses Bisnis harus memiliki setidaknya satu anggota');
    }
    return unique;
  }

  private async assertTeam(penanggungJawabId: string, anggotaIds: string[]): Promise<void> {
    if (anggotaIds.includes(penanggungJawabId)) {
      throw new BadRequestException('Penanggung Jawab Proses Bisnis tidak perlu diduplikasi sebagai anggota');
    }

    const required = [penanggungJawabId, ...anggotaIds];
    const active = await this.repositoriProsesBisnis.findActiveUsersByIds(required);
    if (active.length !== required.length) {
      throw new BadRequestException('Penanggung Jawab Proses Bisnis dan seluruh anggota harus pengguna aktif');
    }
  }

  private async resolveDepartemen(
    lingkup: LingkupOrganisasi,
    departemenId: string | null | undefined,
  ): Promise<string | null> {
    if (lingkup === LingkupOrganisasi.FACULTY) {
      if (departemenId !== null && departemenId !== undefined) {
        throw new BadRequestException('Proses Bisnis lingkup FACULTY tidak boleh memiliki departemenId');
      }
      return null;
    }

    if (!departemenId) {
      throw new BadRequestException('Proses Bisnis lingkup DEPARTMENT wajib memiliki departemenId');
    }
    if (!(await this.repositoriProsesBisnis.departmentExists(departemenId))) {
      throw new BadRequestException('Departemen tidak ditemukan');
    }
    return departemenId;
  }

  private rethrowKnownConflict(error: unknown, message: string): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'P2002' || error.code === 'P2025')
    ) {
      throw new BadRequestException(message);
    }
    throw error;
  }
}
