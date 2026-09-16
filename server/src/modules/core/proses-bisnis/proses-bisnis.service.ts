import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CreateDepartemenDto,
  UpdateDepartemenDto,
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

  listMemberDirectory() {
    return this.repositoriProsesBisnis.listMemberDirectory();
  }

  async transferAnggota(penggunaId: string, sourceProsesBisnisId: string, targetProsesBisnisId: string) {
    const [user, membership, target, targetStatus] = await Promise.all([
      this.repositoriProsesBisnis.findActiveUser(penggunaId),
      this.repositoriProsesBisnis.findMemberMembership(penggunaId, sourceProsesBisnisId),
      this.repositoriProsesBisnis.findProsesBisnis(targetProsesBisnisId),
      this.repositoriProsesBisnis.findProcessStatus(targetProsesBisnisId),
    ]);
    if (user === null || user.platformRole !== 'USER') {
      throw new BadRequestException('Akun USER aktif tidak ditemukan');
    }
    if (membership === null) {
      throw new BadRequestException('Akun belum menjadi anggota Proses Bisnis');
    }
    if (target === null) {
      throw new BadRequestException('Proses Bisnis tujuan tidak ditemukan');
    }
    if (membership.prosesBisnisId === targetProsesBisnisId) {
      throw new BadRequestException('Proses Bisnis tujuan sama dengan asal');
    }
    if (target.penanggungJawabId === penggunaId) {
      throw new BadRequestException('Penanggung Jawab Proses Bisnis tidak dipindahkan sebagai anggota');
    }
    if (targetStatus?.status === 'ARCHIVED') {
      throw new BadRequestException('Proses Bisnis tujuan sudah diarsipkan');
    }
    const alreadyMember = await this.repositoriProsesBisnis.findMemberMembership(penggunaId, targetProsesBisnisId);
    if (alreadyMember !== null) {
      throw new BadRequestException('Akun sudah menjadi anggota Proses Bisnis tujuan');
    }
    await this.repositoriProsesBisnis.transferMember(penggunaId, sourceProsesBisnisId, targetProsesBisnisId);
    return { penggunaId, fromProsesBisnisId: membership.prosesBisnisId, toProsesBisnisId: targetProsesBisnisId };
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
