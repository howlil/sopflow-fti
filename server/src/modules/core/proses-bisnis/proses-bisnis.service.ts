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
