import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationalScope } from '../../../generated/prisma';
import type {
  CreateDepartmentDto,
  CreateProcessDto,
  UpdateDepartmentDto,
  UpdateProcessDto,
} from './dto/process-admin.dto';
import { ProcessRepository } from './process.repository';

@Injectable()
export class ProcessService {
  constructor(private readonly processRepository: ProcessRepository) {}

  listDepartments() {
    return this.processRepository.listDepartments();
  }

  async createDepartment(dto: CreateDepartmentDto) {
    try {
      return await this.processRepository.createDepartment(dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Nama departemen sudah digunakan');
    }
  }

  async updateDepartment(departmentId: string, dto: UpdateDepartmentDto) {
    if (dto.nama === undefined) {
      throw new BadRequestException('Tidak ada perubahan departemen');
    }
    try {
      return await this.processRepository.updateDepartment(departmentId, dto.nama.trim());
    } catch (error) {
      this.rethrowKnownConflict(error, 'Departemen tidak ditemukan atau nama sudah digunakan');
    }
  }

  listAssignableUsers(search?: string) {
    return this.processRepository.listAssignableUsers(search);
  }

  listProcesses() {
    return this.processRepository.listProcesses();
  }

  async createProcess(dto: CreateProcessDto) {
    const memberIds = this.normalizeMemberIds(dto.memberIds);
    const departmentId = await this.resolveDepartment(dto.scope, dto.departmentId);
    await this.assertTeam(dto.ownerId, memberIds);

    return this.processRepository.createProcess({
      nama: dto.nama.trim(),
      scope: dto.scope,
      departmentId,
      ownerId: dto.ownerId,
      memberIds,
    });
  }

  async updateProcess(processId: string, dto: UpdateProcessDto) {
    const current = await this.processRepository.findProcessById(processId);
    if (current === null) {
      throw new NotFoundException('Process tidak ditemukan');
    }

    const scope = dto.scope ?? current.scope;
    const requestedDepartment =
      dto.departmentId !== undefined
        ? dto.departmentId
        : dto.scope === OrganizationalScope.FACULTY
          ? null
          : current.departmentId;
    const departmentId = await this.resolveDepartment(scope, requestedDepartment);
    const ownerId = dto.ownerId ?? current.ownerId;
    const memberIds = this.normalizeMemberIds(
      dto.memberIds ?? current.members.map((member) => member.penggunaId),
    );

    await this.assertTeam(ownerId, memberIds);

    return this.processRepository.updateProcess(processId, {
      nama: dto.nama?.trim() ?? current.nama,
      scope,
      departmentId,
      ownerId,
      memberIds,
    });
  }

  private normalizeMemberIds(memberIds: string[]): string[] {
    const unique = [...new Set(memberIds)];
    if (unique.length < 1) {
      throw new BadRequestException('Process harus memiliki setidaknya satu member');
    }
    return unique;
  }

  private async assertTeam(ownerId: string, memberIds: string[]): Promise<void> {
    if (memberIds.includes(ownerId)) {
      throw new BadRequestException('Process Owner tidak perlu diduplikasi sebagai member');
    }

    const required = [ownerId, ...memberIds];
    const active = await this.processRepository.findActiveUsersByIds(required);
    if (active.length !== required.length) {
      throw new BadRequestException('Process Owner dan seluruh member harus pengguna aktif');
    }
  }

  private async resolveDepartment(
    scope: OrganizationalScope,
    departmentId: string | null | undefined,
  ): Promise<string | null> {
    if (scope === OrganizationalScope.FACULTY) {
      if (departmentId !== null && departmentId !== undefined) {
        throw new BadRequestException('Process scope FACULTY tidak boleh memiliki departmentId');
      }
      return null;
    }

    if (!departmentId) {
      throw new BadRequestException('Process scope DEPARTMENT wajib memiliki departmentId');
    }
    if (!(await this.processRepository.departmentExists(departmentId))) {
      throw new BadRequestException('Department tidak ditemukan');
    }
    return departmentId;
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
