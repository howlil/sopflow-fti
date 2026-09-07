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
  PlatformRole,
  JenisAktivitasProsesBisnis,
  StatusUndanganAnggotaProsesBisnis,
  StatusKeaktifanProsesBisnis,
  StatusSOP,
} from '../../../generated/prisma';
import type {
  AcceptUndanganAnggotaProsesBisnisDto,
  ArchiveOwnedProsesBisnisDto,
  CreateOwnedProsesBisnisDto,
  InviteAnggotaProsesBisnisDto,
  RenameOwnedProsesBisnisDto,
} from './dto/process-owner.dto';
import { KewenanganPenanggungJawabProsesBisnisService } from './process-owner-authority.service';

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
  StatusSOP.EFFECTIVE,
  StatusSOP.SUPERSEDED,
  StatusSOP.REVOKED,
];

@Injectable()
export class ProsesBisnisOwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: KewenanganPenanggungJawabProsesBisnisService,
  ) {}

  listScopes(penggunaId: string) {
    return this.authorityService.listMine(penggunaId);
  }

  async listOwnedProsesBisnises(penggunaId: string) {
    const rows = await this.prisma.prosesBisnis.findMany({
      where: { ownerId: penggunaId },
      include: processInclude,
      orderBy: [{ scope: 'asc' }, { nama: 'asc' }],
    });
    return this.withLifecycle(rows);
  }

  async listAssignableUsers(penggunaId: string, search?: string) {
    await this.assertHasOwnerCapability(penggunaId);
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

  async createProsesBisnis(penggunaId: string, dto: CreateOwnedProsesBisnisDto) {
    const scope = await this.authorityService.assertCanCreate(
      penggunaId,
      dto.scope,
      dto.departemenId,
    );
    await this.assertUniqueIdentity(dto.nama.trim(), scope.scope, scope.departemenId);

    const created = await this.prisma.$transaction(async (tx) => {
      const process = await tx.prosesBisnis.create({
        data: {
          nama: dto.nama.trim(),
          scope: scope.scope,
          departemenId: scope.departemenId,
          ownerId: penggunaId,
        },
        include: processInclude,
      });
      await tx.statusProsesBisnis.create({
        data: { prosesBisnisId: process.prosesBisnisId, status: StatusKeaktifanProsesBisnis.ACTIVE },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId: process.prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.PROCESS_CREATED,
          metadata: { scope: scope.scope, departemenId: scope.departemenId },
        },
      });
      return process;
    });
    return (await this.withLifecycle([created]))[0];
  }

  async renameProsesBisnis(penggunaId: string, prosesBisnisId: string, dto: RenameOwnedProsesBisnisDto) {
    const process = await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, true);
    const nama = dto.nama.trim();
    await this.assertUniqueIdentity(nama, process.scope, process.departemenId, prosesBisnisId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.prosesBisnis.update({
        where: { prosesBisnisId },
        data: { nama },
        include: processInclude,
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.PROCESS_RENAMED,
          metadata: { previousName: process.nama, nextName: nama },
        },
      });
      return row;
    });
    return (await this.withLifecycle([updated]))[0];
  }

  async addExistingMember(penggunaId: string, prosesBisnisId: string, memberId: string) {
    const process = await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, true);
    if (process.ownerId === memberId) {
      throw new ConflictException('Penanggung Jawab Proses Bisnis tidak perlu ditambahkan sebagai member');
    }
    const member = await this.prisma.pengguna.findFirst({
      where: { penggunaId: memberId, deletedAt: null, platformRole: PlatformRole.USER },
      select: userSelect,
    });
    if (member === null) {
      throw new NotFoundException('Akun USER aktif tidak ditemukan');
    }
    const existing = await this.prisma.anggotaProsesBisnis.findUnique({
      where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: memberId } },
    });
    if (existing !== null) {
      return member;
    }
    await this.prisma.$transaction([
      this.prisma.anggotaProsesBisnis.create({ data: { prosesBisnisId, penggunaId: memberId } }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.MEMBER_ADDED,
          targetUserId: memberId,
        },
      }),
    ]);
    return member;
  }

  async removeMember(penggunaId: string, prosesBisnisId: string, memberId: string) {
    await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, true);
    const membership = await this.prisma.anggotaProsesBisnis.findUnique({
      where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: memberId } },
    });
    if (membership === null) {
      throw new NotFoundException('Member Proses Bisnis tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.anggotaProsesBisnis.delete({
        where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: memberId } },
      }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.MEMBER_REMOVED,
          targetUserId: memberId,
        },
      }),
    ]);
  }

  async inviteMember(penggunaId: string, prosesBisnisId: string, dto: InviteAnggotaProsesBisnisDto) {
    await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, true);
    const email = dto.email.trim().toLowerCase();
    const nip = dto.nip.trim();
    const existing = await this.prisma.pengguna.findFirst({
      where: { OR: [{ email }, { nip }] },
    });
    if (existing !== null) {
      if (existing.deletedAt !== null) {
        throw new ConflictException('Akun dengan identitas ini sedang nonaktif');
      }
      await this.addExistingMember(penggunaId, prosesBisnisId, existing.penggunaId);
      return {
        kind: 'MEMBER_ADDED' as const,
        member: { penggunaId: existing.penggunaId, nama: existing.nama, email: existing.email },
      };
    }

    const pending = await this.prisma.undanganAnggotaProsesBisnis.findFirst({
      where: { prosesBisnisId, email, status: StatusUndanganAnggotaProsesBisnis.PENDING },
      select: { undanganAnggotaProsesBisnisId: true, expiresAt: true },
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
        await tx.undanganAnggotaProsesBisnis.update({
          where: { undanganAnggotaProsesBisnisId: pending.undanganAnggotaProsesBisnisId },
          data: { status: StatusUndanganAnggotaProsesBisnis.EXPIRED },
        });
      }
      const row = await tx.undanganAnggotaProsesBisnis.create({
        data: {
          prosesBisnisId,
          email,
          nama: dto.nama.trim(),
          nip,
          jabatan: dto.jabatan.trim(),
          pangkat: dto.pangkat.trim(),
          nohp,
          tokenHash,
          invitedById: penggunaId,
          expiresAt,
        },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.INVITATION_CREATED,
          metadata: { email, invitationId: row.undanganAnggotaProsesBisnisId, expiresAt: expiresAt.toISOString() },
        },
      });
      return row;
    });

    return {
      kind: 'INVITATION_CREATED' as const,
      invitation: {
        undanganAnggotaProsesBisnisId: invitation.undanganAnggotaProsesBisnisId,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      activationPath: `/login?invite=${token}`,
    };
  }

  async previewInvitation(token: string) {
    const invitation = await this.findUsableInvitation(token);
    const process = await this.prisma.prosesBisnis.findUnique({
      where: { prosesBisnisId: invitation.prosesBisnisId },
      select: { prosesBisnisId: true, nama: true, scope: true, departemenId: true },
    });
    if (process === null) {
      throw new NotFoundException('Proses Bisnis undangan tidak ditemukan');
    }
    return {
      email: invitation.email,
      nama: invitation.nama,
      expiresAt: invitation.expiresAt,
      process,
    };
  }

  async acceptInvitation(token: string, dto: AcceptUndanganAnggotaProsesBisnisDto) {
    const invitation = await this.findUsableInvitation(token);
    const existingIdentity = await this.prisma.pengguna.findFirst({
      where: { OR: [{ email: invitation.email }, { nip: invitation.nip }] },
      select: { penggunaId: true },
    });
    if (existingIdentity !== null) {
      throw new ConflictException(
        'Identitas akun sudah tersedia. Minta Penanggung Jawab Proses Bisnis menambahkan akun yang sudah ada.',
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
          platformRole: PlatformRole.USER,
        },
        select: userSelect,
      });
      await tx.anggotaProsesBisnis.create({
        data: { prosesBisnisId: invitation.prosesBisnisId, penggunaId: user.penggunaId },
      });
      await tx.undanganAnggotaProsesBisnis.update({
        where: { undanganAnggotaProsesBisnisId: invitation.undanganAnggotaProsesBisnisId },
        data: {
          status: StatusUndanganAnggotaProsesBisnis.ACCEPTED,
          acceptedById: user.penggunaId,
          acceptedAt: now,
        },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId: invitation.prosesBisnisId,
          actorId: user.penggunaId,
          event: JenisAktivitasProsesBisnis.INVITATION_ACCEPTED,
          targetUserId: user.penggunaId,
          metadata: { invitationId: invitation.undanganAnggotaProsesBisnisId },
        },
      });
      return user;
    });
    return created;
  }

  async archiveProsesBisnis(penggunaId: string, prosesBisnisId: string, dto: ArchiveOwnedProsesBisnisDto) {
    await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, true);
    const inFlight = await this.prisma.detailSOP.count({
      where: {
        sop: { prosesBisnisId },
        status: { notIn: TERMINAL_SOP_STATUSES },
      },
    });
    if (inFlight > 0) {
      throw new ConflictException('Proses Bisnis masih memiliki SOP aktif/draft; selesaikan lifecycle sebelum arsip');
    }
    const archivedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.statusProsesBisnis.upsert({
        where: { prosesBisnisId },
        create: {
          prosesBisnisId,
          status: StatusKeaktifanProsesBisnis.ARCHIVED,
          archivedAt,
          archivedReason: dto.reason.trim(),
        },
        update: {
          status: StatusKeaktifanProsesBisnis.ARCHIVED,
          archivedAt,
          archivedReason: dto.reason.trim(),
        },
      }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.PROCESS_ARCHIVED,
          metadata: { reason: dto.reason.trim() },
        },
      }),
    ]);
  }

  async listAudit(penggunaId: string, prosesBisnisId: string) {
    await this.requireOwnedProsesBisnis(penggunaId, prosesBisnisId, false);
    return this.prisma.riwayatAktivitasProsesBisnis.findMany({
      where: { prosesBisnisId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async assertHasOwnerCapability(penggunaId: string): Promise<void> {
    const [scopeCount, processCount] = await Promise.all([
      this.prisma.kewenanganPenanggungJawabProsesBisnis.count({ where: { penggunaId, revokedAt: null } }),
      this.prisma.prosesBisnis.count({ where: { ownerId: penggunaId } }),
    ]);
    if (scopeCount === 0 && processCount === 0) {
      throw new ForbiddenException('Daftar akun hanya tersedia untuk Penanggung Jawab Proses Bisnis');
    }
  }

  private async requireOwnedProsesBisnis(penggunaId: string, prosesBisnisId: string, requireActive: boolean) {
    const process = await this.prisma.prosesBisnis.findFirst({
      where: { prosesBisnisId, ownerId: penggunaId },
      include: processInclude,
    });
    if (process === null) {
      throw new ForbiddenException('Hanya Penanggung Jawab Proses Bisnis yang dapat mengelola Proses Bisnis ini');
    }
    if (requireActive && !(await this.isProsesBisnisActive(prosesBisnisId))) {
      throw new ConflictException('Proses Bisnis sudah diarsipkan');
    }
    return process;
  }

  private async isProsesBisnisActive(prosesBisnisId: string): Promise<boolean> {
    const lifecycle = await this.prisma.statusProsesBisnis.findUnique({ where: { prosesBisnisId } });
    return lifecycle === null || lifecycle.status === StatusKeaktifanProsesBisnis.ACTIVE;
  }

  private async assertUniqueIdentity(
    nama: string,
    scope: import('../../../generated/prisma').LingkupOrganisasi,
    departemenId: string | null,
    exceptProsesBisnisId?: string,
  ) {
    const duplicate = await this.prisma.prosesBisnis.count({
      where: {
        nama,
        scope,
        departemenId,
        ...(exceptProsesBisnisId ? { NOT: { prosesBisnisId: exceptProsesBisnisId } } : {}),
      },
    });
    if (duplicate > 0) {
      throw new ConflictException('Nama Proses Bisnis sudah digunakan pada scope yang sama');
    }
  }

  private async withLifecycle<T extends { prosesBisnisId: string }>(rows: T[]) {
    const lifecycleRows = await this.prisma.statusProsesBisnis.findMany({
      where: { prosesBisnisId: { in: rows.map((row) => row.prosesBisnisId) } },
    });
    const lifecycleById = new Map(lifecycleRows.map((row) => [row.prosesBisnisId, row]));
    return rows.map((row) => {
      const lifecycle = lifecycleById.get(row.prosesBisnisId);
      return {
        ...row,
        lifecycleStatus: lifecycle?.status ?? StatusKeaktifanProsesBisnis.ACTIVE,
        archivedAt: lifecycle?.archivedAt ?? null,
        archivedReason: lifecycle?.archivedReason ?? null,
      };
    });
  }

  private async findUsableInvitation(token: string) {
    const invitation = await this.prisma.undanganAnggotaProsesBisnis.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (invitation === null || invitation.status !== StatusUndanganAnggotaProsesBisnis.PENDING) {
      throw new NotFoundException('Undangan tidak ditemukan atau sudah digunakan');
    }
    if (invitation.expiresAt <= new Date()) {
      await this.prisma.undanganAnggotaProsesBisnis.update({
        where: { undanganAnggotaProsesBisnisId: invitation.undanganAnggotaProsesBisnisId },
        data: { status: StatusUndanganAnggotaProsesBisnis.EXPIRED },
      });
      throw new ConflictException('Undangan sudah kedaluwarsa');
    }
    if (!(await this.isProsesBisnisActive(invitation.prosesBisnisId))) {
      throw new ConflictException('Proses Bisnis pada undangan sudah tidak aktif');
    }
    return invitation;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
