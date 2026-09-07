import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LingkupOrganisasi } from '../../../generated/prisma';
import type {
  CreateDepartemenDto,
  CreateProsesBisnisDto,
  UpdateDepartemenDto,
  UpdateProsesBisnisDto,
} from './dto/administrasi-proses-bisnis.dto';
import { ProsesBisnisRepository } from './process.repository';

@Injectable()
export class ProsesBisnisService {
  constructor(private readonly processRepository: ProsesBisnisRepository) {}

  listDepartemen() {
    return this.processRepository.listDepartemen();
  }

  async createDepartemen(dto: CreateDepartemenDto) {
    try {
      return await this.processRepository.createDepartemen(dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Nama departemen sudah digunakan');
    }
  }

  async updateDepartemen(departemenId: string, dto: UpdateDepartemenDto) {
    if (dto.nama === undefined) {
      throw new BadRequestException('Tidak ada perubahan departemen');
    }
    try {
      return await this.processRepository.updateDepartemen(departemenId, dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Departemen tidak ditemukan atau nama sudah digunakan');
    }
  }

  listAssignableUsers(search?: string) {
    return this.processRepository.listAssignableUsers(search);
  }

  listProsesBisnis() {
    return this.processRepository.listProsesBisnis();
  }

  async createProsesBisnis(dto: CreateProsesBisnisDto) {
    const memberIds = this.normalizeMemberIds(dto.memberIds);
    const departemenId = await this.resolveDepartemen(dto.scope, dto.departemenId);
    await this.assertTeam(dto.ownerId, memberIds);

    return this.processRepository.createProsesBisnis({
      nama: dto.nama.trim(),
      scope: dto.scope,
      departemenId,
      ownerId: dto.ownerId,
      memberIds,
    });
  }

  async updateProsesBisnis(prosesBisnisId: string, dto: UpdateProsesBisnisDto) {
    const current = await this.processRepository.findProsesBisnisById(prosesBisnisId);
    if (current === null) {
      throw new NotFoundException('Proses Bisnis tidak ditemukan');
    }

    const scope = dto.scope ?? current.scope;
    const requestedDepartemen =
      dto.departemenId !== undefined
        ? dto.departemenId
        : dto.scope === LingkupOrganisasi.FACULTY
          ? null
          : current.departemenId;
    const departemenId = await this.resolveDepartemen(scope, requestedDepartemen);
    const ownerId = dto.ownerId ?? current.ownerId;
    const memberIds = this.normalizeMemberIds(
      dto.memberIds ?? current.members.map((member) => member.penggunaId),
    );

    await this.assertTeam(ownerId, memberIds);

    return this.processRepository.updateProsesBisnis(prosesBisnisId, {
      nama: dto.nama?.trim() ?? current.nama,
      scope,
      departemenId,
      ownerId,
      memberIds,
    });
  }

  private normalizeMemberIds(memberIds: string[]): string[] {
    const unique = [...new Set(memberIds)];
    if (unique.length < 1) {
      throw new BadRequestException('Proses Bisnis harus memiliki setidaknya satu member');
    }
    return unique;
  }

  private async assertTeam(ownerId: string, memberIds: string[]): Promise<void> {
    if (memberIds.includes(ownerId)) {
      throw new BadRequestException('Penanggung Jawab Proses Bisnis tidak perlu diduplikasi sebagai member');
    }

    const required = [ownerId, ...memberIds];
    const active = await this.processRepository.findActiveUsersByIds(required);
    if (active.length !== required.length) {
      throw new BadRequestException('Penanggung Jawab Proses Bisnis dan seluruh member harus pengguna aktif');
    }
  }

  private async resolveDepartemen(
    scope: LingkupOrganisasi,
    departemenId: string | null | undefined,
  ): Promise<string | null> {
    if (scope === LingkupOrganisasi.FACULTY) {
      if (departemenId !== null && departemenId !== undefined) {
        throw new BadRequestException('Proses Bisnis scope FACULTY tidak boleh memiliki departemenId');
      }
      return null;
    }

    if (!departemenId) {
      throw new BadRequestException('Proses Bisnis scope DEPARTMENT wajib memiliki departemenId');
    }
    if (!(await this.processRepository.departmentExists(departemenId))) {
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
