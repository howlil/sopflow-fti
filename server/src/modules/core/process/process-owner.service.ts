import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { BCRYPT_SALT_ROUNDS } from '../../../common/auth/password.constants';
import { requireIndonesianMobileNumber } from '../../../common/pengguna/pengguna-admin.util';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  PeranPengguna,
  PlatformRole,
  ProcessAuditEvent,
  ProcessInvitationStatus,
  ProcessLifecycleStatus,
  StatusSOP,
} from '../../../generated/prisma';
import type {
  AcceptProcessInvitationDto,
  ArchiveOwnedProcessDto,
  CreateOwnedProcessDto,
  InviteProcessMemberDto,
  RenameOwnedProcessDto,
} from './dto/process-owner.dto';
import { ProcessOwnerAuthorityService } from './process-owner-authority.service';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  nip: true,
  platformRole: true,
} as const;

const processInclude = {
  department: true,
  owner: { select: userSelect },
  members: {
    include: { pengguna: { select: userSelect } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const TERMINAL_SOP_STATUSES: StatusSOP[] = [
  StatusSOP.BERLAKU,
  StatusSOP.DIGANTIKAN,
  StatusSOP.DICABUT,
];

@Injectable()
export class ProcessOwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: ProcessOwnerAuthorityService,
  ) {}

  listScopes(penggunaId: string) {
    return this.authorityService.listMine(penggunaId);
  }

  async listOwnedProcesses(penggunaId: string) {
    const rows = await this.prisma.process.findMany({
      where: { ownerId: penggunaId },
      include: processInclude,
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
    return this.withLifecycle(rows);
  }

  listAssignableUsers(search?: string) {
    const term = search?.trim();
    return this.prisma.pengguna.findMany({
      where: {
        deletedAt: null,
        platformRole: PlatformRole.USER,
        ...(term
          ? {
              OR: [
                { nama: { contains: term } },
                { email: { contains: term } },
                { nip: { contains: term } },
              ],
            }
          : {}),
      },
      select: userSelect,
      orderBy: { nama: 'asc' },
      take: 100,
    });
  }

  async createProcess(penggunaId: string, dto: CreateOwnedProcessDto) {
    const scope = await this.authorityService.assertCanCreate(
      penggunaId,
      dto.scope,
      dto.departmentId,
    );
    await this.assertUniqueIdentity(dto.nama.trim(), scope.scope, scope.departmentId);

    const created = await this.prisma.$transaction(async (tx) => {
      const process = await tx.process.create({
        data: {
          nama: dto.nama.trim(),
          scope: scope.scope,
          departmentId: scope.departmentId,
          ownerId: penggunaId,
        },
        include: processInclude,
      });
      await tx.processLifecycle.create({
        data: { processId: process.processId, status: ProcessLifecycleStatus.ACTIVE },
      });
      await tx.processAudit.create({
        data: {
          processId: process.processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.PROCESS_CREATED,
          metadata: { scope: scope.scope, departmentId: scope.departmentId },
        },
      });
      return process;
    });
    return (await this.withLifecycle([created]))[0];
  }

  async renameProcess(penggunaId: string, processId: string, dto: RenameOwnedProcessDto) {
    const process = await this.requireOwnedProcess(penggunaId, processId, true);
    const nama = dto.nama.trim();
    await this.assertUniqueIdentity(nama, process.scope, process.departmentId, processId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.process.update({
        where: { processId },
        data: { nama },
        include: processInclude,
      });
      await tx.processAudit.create({
        data: {
          processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.PROCESS_RENAMED,
          metadata: { previousName: process.nama, nextName: nama },
        },
      });
      return row;
    });
    return (await this.withLifecycle([updated]))[0];
  }

  async addExistingMember(penggunaId: string, processId: string, memberId: string) {
    const process = await this.requireOwnedProcess(penggunaId, processId, true);
    if (process.ownerId === memberId) {
      throw new ConflictException('Process Owner tidak perlu ditambahkan sebagai member');
    }
    const member = await this.prisma.pengguna.findFirst({
      where: { penggunaId: memberId, deletedAt: null, platformRole: PlatformRole.USER },
      select: userSelect,
    });
    if (member === null) {
      throw new NotFoundException('Akun USER aktif tidak ditemukan');
    }
    const existing = await this.prisma.processMember.findUnique({
      where: { processId_penggunaId: { processId, penggunaId: memberId } },
    });
    if (existing !== null) {
      return member;
    }
    await this.prisma.$transaction([
      this.prisma.processMember.create({ data: { processId, penggunaId: memberId } }),
      this.prisma.processAudit.create({
        data: {
          processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.MEMBER_ADDED,
          targetUserId: memberId,
        },
      }),
    ]);
    return member;
  }

  async removeMember(penggunaId: string, processId: string, memberId: string) {
    await this.requireOwnedProcess(penggunaId, processId, true);
    const membership = await this.prisma.processMember.findUnique({
      where: { processId_penggunaId: { processId, penggunaId: memberId } },
    });
    if (membership === null) {
      throw new NotFoundException('Member Process tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.processMember.delete({
        where: { processId_penggunaId: { processId, penggunaId: memberId } },
      }),
      this.prisma.processAudit.create({
        data: {
          processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.MEMBER_REMOVED,
          targetUserId: memberId,
        },
      }),
    ]);
  }

  async inviteMember(penggunaId: string, processId: string, dto: InviteProcessMemberDto) {
    await this.requireOwnedProcess(penggunaId, processId, true);
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.pengguna.findUnique({ where: { email } });
    if (existing !== null) {
      if (existing.deletedAt !== null) {
        throw new ConflictException('Akun dengan email ini sedang nonaktif');
      }
      await this.addExistingMember(penggunaId, processId, existing.penggunaId);
      return {
        kind: 'MEMBER_ADDED' as const,
        member: { penggunaId: existing.penggunaId, nama: existing.nama, email: existing.email },
      };
    }

    const pending = await this.prisma.processInvitation.findFirst({
      where: { processId, email, status: ProcessInvitationStatus.PENDING },
      select: { processInvitationId: true, expiresAt: true },
    });
    if (pending !== null && pending.expiresAt > new Date()) {
      throw new ConflictException('Undangan aktif untuk email ini sudah tersedia');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const nohp = requireIndonesianMobileNumber(dto.nohp);
    const invitation = await this.prisma.$transaction(async (tx) => {
      if (pending !== null) {
        await tx.processInvitation.update({
          where: { processInvitationId: pending.processInvitationId },
          data: { status: ProcessInvitationStatus.EXPIRED },
        });
      }
      const row = await tx.processInvitation.create({
        data: {
          processId,
          email,
          nama: dto.nama.trim(),
          nip: dto.nip.trim(),
          jabatan: dto.jabatan.trim(),
          pangkat: dto.pangkat.trim(),
          nohp,
          tokenHash,
          invitedById: penggunaId,
          expiresAt,
        },
      });
      await tx.processAudit.create({
        data: {
          processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.INVITATION_CREATED,
          metadata: { email, invitationId: row.processInvitationId, expiresAt: expiresAt.toISOString() },
        },
      });
      return row;
    });

    return {
      kind: 'INVITATION_CREATED' as const,
      invitation: {
        processInvitationId: invitation.processInvitationId,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      activationPath: `/login?invite=${token}`,
    };
  }

  async previewInvitation(token: string) {
    const invitation = await this.findUsableInvitation(token);
    const process = await this.prisma.process.findUnique({
      where: { processId: invitation.processId },
      select: { processId: true, nama: true, scope: true, departmentId: true },
    });
    if (process === null) {
      throw new NotFoundException('Process undangan tidak ditemukan');
    }
    return {
      email: invitation.email,
      nama: invitation.nama,
      expiresAt: invitation.expiresAt,
      process,
    };
  }

  async acceptInvitation(token: string, dto: AcceptProcessInvitationDto) {
    const invitation = await this.findUsableInvitation(token);
    const existingIdentity = await this.prisma.pengguna.findFirst({
      where: { OR: [{ email: invitation.email }, { nip: invitation.nip }] },
      select: { penggunaId: true },
    });
    if (existingIdentity !== null) {
      throw new ConflictException(
        'Identitas akun sudah tersedia. Minta Process Owner menambahkan akun yang sudah ada.',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.pengguna.create({
        data: {
          email: invitation.email,
          nama: invitation.nama,
          nip: invitation.nip,
          jabatan: invitation.jabatan,
          pangkat: invitation.pangkat,
          nohp: invitation.nohp,
          kataSandi: passwordHash,
          passwordChangedAt: now,
          peran: PeranPengguna.PENYUSUN,
          platformRole: PlatformRole.USER,
        },
        select: userSelect,
      });
      await tx.processMember.create({
        data: { processId: invitation.processId, penggunaId: user.penggunaId },
      });
      await tx.processInvitation.update({
        where: { processInvitationId: invitation.processInvitationId },
        data: {
          status: ProcessInvitationStatus.ACCEPTED,
          acceptedById: user.penggunaId,
          acceptedAt: now,
        },
      });
      await tx.processAudit.create({
        data: {
          processId: invitation.processId,
          actorId: user.penggunaId,
          event: ProcessAuditEvent.INVITATION_ACCEPTED,
          targetUserId: user.penggunaId,
          metadata: { invitationId: invitation.processInvitationId },
        },
      });
      return user;
    });
    return created;
  }

  async archiveProcess(penggunaId: string, processId: string, dto: ArchiveOwnedProcessDto) {
    await this.requireOwnedProcess(penggunaId, processId, true);
    const inFlight = await this.prisma.detailSOP.count({
      where: {
        sop: { processId },
        status: { notIn: TERMINAL_SOP_STATUSES },
      },
    });
    if (inFlight > 0) {
      throw new ConflictException('Process masih memiliki SOP aktif/draft; selesaikan lifecycle sebelum arsip');
    }
    const archivedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.processLifecycle.upsert({
        where: { processId },
        create: {
          processId,
          status: ProcessLifecycleStatus.ARCHIVED,
          archivedAt,
          archivedReason: dto.reason.trim(),
        },
        update: {
          status: ProcessLifecycleStatus.ARCHIVED,
          archivedAt,
          archivedReason: dto.reason.trim(),
        },
      }),
      this.prisma.processAudit.create({
        data: {
          processId,
          actorId: penggunaId,
          event: ProcessAuditEvent.PROCESS_ARCHIVED,
          metadata: { reason: dto.reason.trim() },
        },
      }),
    ]);
  }

  async listAudit(penggunaId: string, processId: string) {
    await this.requireOwnedProcess(penggunaId, processId, false);
    return this.prisma.processAudit.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async requireOwnedProcess(penggunaId: string, processId: string, requireActive: boolean) {
    const process = await this.prisma.process.findFirst({
      where: { processId, ownerId: penggunaId },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Hanya Process Owner yang dapat mengelola Process ini');
    }
    if (requireActive && !(await this.isProcessActive(processId))) {
      throw new ConflictException('Process sudah diarsipkan');
    }
    return process;
  }

  private async isProcessActive(processId: string): Promise<boolean> {
    const lifecycle = await this.prisma.processLifecycle.findUnique({ where: { processId } });
    return lifecycle === null || lifecycle.status === ProcessLifecycleStatus.ACTIVE;
  }

  private async assertUniqueIdentity(
    nama: string,
    scope: import('../../../generated/prisma').OrganizationalScope,
    departmentId: string | null,
    exceptProcessId?: string,
  ) {
    const duplicate = await this.prisma.process.count({
      where: {
        nama,
        scope,
        departmentId,
        ...(exceptProcessId ? { NOT: { processId: exceptProcessId } } : {}),
      },
    });
    if (duplicate > 0) {
      throw new ConflictException('Nama Process sudah digunakan pada scope yang sama');
    }
  }

  private async withLifecycle<T extends { processId: string }>(rows: T[]) {
    const lifecycleRows = await this.prisma.processLifecycle.findMany({
      where: { processId: { in: rows.map((row) => row.processId) } },
    });
    const lifecycleById = new Map(lifecycleRows.map((row) => [row.processId, row]));
    return rows.map((row) => {
      const lifecycle = lifecycleById.get(row.processId);
      return {
        ...row,
        lifecycleStatus: lifecycle?.status ?? ProcessLifecycleStatus.ACTIVE,
        archivedAt: lifecycle?.archivedAt ?? null,
        archivedReason: lifecycle?.archivedReason ?? null,
      };
    });
  }

  private async findUsableInvitation(token: string) {
    const invitation = await this.prisma.processInvitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (invitation === null || invitation.status !== ProcessInvitationStatus.PENDING) {
      throw new NotFoundException('Undangan tidak ditemukan atau sudah digunakan');
    }
    if (invitation.expiresAt <= new Date()) {
      await this.prisma.processInvitation.update({
        where: { processInvitationId: invitation.processInvitationId },
        data: { status: ProcessInvitationStatus.EXPIRED },
      });
      throw new ConflictException('Undangan sudah kedaluwarsa');
    }
    if (!(await this.isProcessActive(invitation.processId))) {
      throw new ConflictException('Process pada undangan sudah tidak aktif');
    }
    return invitation;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
