import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { BCRYPT_SALT_ROUNDS } from '../../../common/auth/password.constants';
import { requireIndonesianMobileNumber } from '../../../common/pengguna/indonesian-mobile-number.util';
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
} from './dto/penanggung-jawab-proses-bisnis.dto';
import { KewenanganPenanggungJawabProsesBisnisService } from './kewenangan-penanggung-jawab-proses-bisnis.service';

const userSelect = {
  penggunaId: true,
  nama: true,
  email: true,
  nip: true,
  platformRole: true,
} as const;

const prosesBisnisInclude = {
  departemen: true,
  penanggungJawab: { select: userSelect },
  anggota: {
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
export class PenanggungJawabProsesBisnisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityService: KewenanganPenanggungJawabProsesBisnisService,
  ) {}

  listLingkup(penggunaId: string) {
    return this.authorityService.listMine(penggunaId);
  }

  async listOwnedProsesBisnis(penggunaId: string) {
    const rows = await this.prisma.prosesBisnis.findMany({
      where: { penanggungJawabId: penggunaId },
      include: prosesBisnisInclude,
      orderBy: [{ lingkup: 'asc' }, { nama: 'asc' }],
    });
    return this.denganSiklus(rows);
  }

  async listAssignableUsers(penggunaId: string, search?: string) {
    await this.pastikanPunyaKewenanganPenanggungJawab(penggunaId);
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
    const lingkup = await this.authorityService.assertCanCreate(
      penggunaId,
      dto.lingkup,
      dto.departemenId,
    );
    await this.pastikanIdentitasUnik(dto.nama.trim(), lingkup.lingkup, lingkup.departemenId);

    const created = await this.prisma.$transaction(async (tx) => {
      const prosesBisnis = await tx.prosesBisnis.create({
        data: {
          nama: dto.nama.trim(),
          lingkup: lingkup.lingkup,
          departemenId: lingkup.departemenId,
          penanggungJawabId: penggunaId,
        },
        include: prosesBisnisInclude,
      });
      await tx.statusProsesBisnis.create({
        data: { prosesBisnisId: prosesBisnis.prosesBisnisId, status: StatusKeaktifanProsesBisnis.ACTIVE },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId: prosesBisnis.prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.PROCESS_CREATED,
          metadata: { lingkup: lingkup.lingkup, departemenId: lingkup.departemenId },
        },
      });
      return prosesBisnis;
    });
    return (await this.denganSiklus([created]))[0];
  }

  async renameProsesBisnis(penggunaId: string, prosesBisnisId: string, dto: RenameOwnedProsesBisnisDto) {
    const prosesBisnis = await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, true);
    const nama = dto.nama.trim();
    await this.pastikanIdentitasUnik(nama, prosesBisnis.lingkup, prosesBisnis.departemenId, prosesBisnisId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.prosesBisnis.update({
        where: { prosesBisnisId },
        data: { nama },
        include: prosesBisnisInclude,
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.PROCESS_RENAMED,
          metadata: { previousName: prosesBisnis.nama, nextName: nama },
        },
      });
      return row;
    });
    return (await this.denganSiklus([updated]))[0];
  }

  async tambahAnggotaTerdaftar(penggunaId: string, prosesBisnisId: string, anggotaId: string) {
    const prosesBisnis = await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, true);
    if (prosesBisnis.penanggungJawabId === anggotaId) {
      throw new ConflictException('Penanggung Jawab Proses Bisnis tidak perlu ditambahkan sebagai anggota');
    }
    const anggota = await this.prisma.pengguna.findFirst({
      where: { penggunaId: anggotaId, deletedAt: null, platformRole: PlatformRole.USER },
      select: userSelect,
    });
    if (anggota === null) {
      throw new NotFoundException('Akun USER aktif tidak ditemukan');
    }
    const existing = await this.prisma.anggotaProsesBisnis.findUnique({
      where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: anggotaId } },
    });
    if (existing !== null) {
      return anggota;
    }
    await this.prisma.$transaction([
      this.prisma.anggotaProsesBisnis.create({ data: { prosesBisnisId, penggunaId: anggotaId } }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.MEMBER_ADDED,
          targetUserId: anggotaId,
        },
      }),
    ]);
    return anggota;
  }

  async hapusAnggota(penggunaId: string, prosesBisnisId: string, anggotaId: string) {
    await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, true);
    const keanggotaan = await this.prisma.anggotaProsesBisnis.findUnique({
      where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: anggotaId } },
    });
    if (keanggotaan === null) {
      throw new NotFoundException('Member Proses Bisnis tidak ditemukan');
    }
    await this.prisma.$transaction([
      this.prisma.anggotaProsesBisnis.delete({
        where: { prosesBisnisId_penggunaId: { prosesBisnisId, penggunaId: anggotaId } },
      }),
      this.prisma.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId,
          actorId: penggunaId,
          event: JenisAktivitasProsesBisnis.MEMBER_REMOVED,
          targetUserId: anggotaId,
        },
      }),
    ]);
  }

  async undangAnggota(penggunaId: string, prosesBisnisId: string, dto: InviteAnggotaProsesBisnisDto) {
    await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, true);
    const email = dto.email.trim().toLowerCase();
    const nip = dto.nip.trim();
    const existing = await this.prisma.pengguna.findFirst({
      where: { OR: [{ email }, { nip }] },
    });
    if (existing !== null) {
      if (existing.deletedAt !== null) {
        throw new ConflictException('Akun dengan identitas ini sedang nonaktif');
      }
      await this.tambahAnggotaTerdaftar(penggunaId, prosesBisnisId, existing.penggunaId);
      return {
        kind: 'MEMBER_ADDED' as const,
        anggota: { penggunaId: existing.penggunaId, nama: existing.nama, email: existing.email },
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
    const undangan = await this.prisma.$transaction(async (tx) => {
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
      undangan: {
        undanganAnggotaProsesBisnisId: undangan.undanganAnggotaProsesBisnisId,
        email: undangan.email,
        expiresAt: undangan.expiresAt,
      },
      activationPath: `/login?invite=${token}`,
    };
  }

  async pratinjauUndangan(token: string) {
    const undangan = await this.cariUndanganAktif(token);
    const prosesBisnis = await this.prisma.prosesBisnis.findUnique({
      where: { prosesBisnisId: undangan.prosesBisnisId },
      select: { prosesBisnisId: true, nama: true, lingkup: true, departemenId: true },
    });
    if (prosesBisnis === null) {
      throw new NotFoundException('Proses Bisnis undangan tidak ditemukan');
    }
    return {
      email: undangan.email,
      nama: undangan.nama,
      expiresAt: undangan.expiresAt,
      prosesBisnis,
    };
  }

  async terimaUndangan(token: string, dto: AcceptUndanganAnggotaProsesBisnisDto) {
    const undangan = await this.cariUndanganAktif(token);
    const existingIdentity = await this.prisma.pengguna.findFirst({
      where: { OR: [{ email: undangan.email }, { nip: undangan.nip }] },
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
          email: undangan.email,
          nama: undangan.nama,
          nip: undangan.nip,
          jabatan: undangan.jabatan,
          pangkat: undangan.pangkat,
          nohp: undangan.nohp,
          kataSandi: passwordHash,
          passwordChangedAt: now,
          platformRole: PlatformRole.USER,
        },
        select: userSelect,
      });
      await tx.anggotaProsesBisnis.create({
        data: { prosesBisnisId: undangan.prosesBisnisId, penggunaId: user.penggunaId },
      });
      await tx.undanganAnggotaProsesBisnis.update({
        where: { undanganAnggotaProsesBisnisId: undangan.undanganAnggotaProsesBisnisId },
        data: {
          status: StatusUndanganAnggotaProsesBisnis.ACCEPTED,
          acceptedById: user.penggunaId,
          acceptedAt: now,
        },
      });
      await tx.riwayatAktivitasProsesBisnis.create({
        data: {
          prosesBisnisId: undangan.prosesBisnisId,
          actorId: user.penggunaId,
          event: JenisAktivitasProsesBisnis.INVITATION_ACCEPTED,
          targetUserId: user.penggunaId,
          metadata: { invitationId: undangan.undanganAnggotaProsesBisnisId },
        },
      });
      return user;
    });
    return created;
  }

  async archiveProsesBisnis(penggunaId: string, prosesBisnisId: string, dto: ArchiveOwnedProsesBisnisDto) {
    await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, true);
    const inFlight = await this.prisma.detailSOP.count({
      where: {
        sop: { prosesBisnisId },
        status: { notIn: TERMINAL_SOP_STATUSES },
      },
    });
    if (inFlight > 0) {
      throw new ConflictException('Proses Bisnis masih memiliki SOP aktif/draft; selesaikan siklus sebelum arsip');
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

  async listRiwayatAktivitas(penggunaId: string, prosesBisnisId: string) {
    await this.wajibProsesBisnisMilikSaya(penggunaId, prosesBisnisId, false);
    return this.prisma.riwayatAktivitasProsesBisnis.findMany({
      where: { prosesBisnisId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async pastikanPunyaKewenanganPenanggungJawab(penggunaId: string): Promise<void> {
    const [scopeCount, processCount] = await Promise.all([
      this.prisma.kewenanganPenanggungJawabProsesBisnis.count({ where: { penggunaId, revokedAt: null } }),
      this.prisma.prosesBisnis.count({ where: { penanggungJawabId: penggunaId } }),
    ]);
    if (scopeCount === 0 && processCount === 0) {
      throw new ForbiddenException('Daftar akun hanya tersedia untuk Penanggung Jawab Proses Bisnis');
    }
  }

  private async wajibProsesBisnisMilikSaya(penggunaId: string, prosesBisnisId: string, requireActive: boolean) {
    const prosesBisnis = await this.prisma.prosesBisnis.findFirst({
      where: { prosesBisnisId, penanggungJawabId: penggunaId },
      include: prosesBisnisInclude,
    });
    if (prosesBisnis === null) {
      throw new ForbiddenException('Hanya Penanggung Jawab Proses Bisnis yang dapat mengelola Proses Bisnis ini');
    }
    if (requireActive && !(await this.isProsesBisnisActive(prosesBisnisId))) {
      throw new ConflictException('Proses Bisnis sudah diarsipkan');
    }
    return prosesBisnis;
  }

  private async isProsesBisnisActive(prosesBisnisId: string): Promise<boolean> {
    const siklus = await this.prisma.statusProsesBisnis.findUnique({ where: { prosesBisnisId } });
    return siklus === null || siklus.status === StatusKeaktifanProsesBisnis.ACTIVE;
  }

  private async pastikanIdentitasUnik(
    nama: string,
    lingkup: import('../../../generated/prisma').LingkupOrganisasi,
    departemenId: string | null,
    exceptProsesBisnisId?: string,
  ) {
    const duplicate = await this.prisma.prosesBisnis.count({
      where: {
        nama,
        lingkup,
        departemenId,
        ...(exceptProsesBisnisId ? { NOT: { prosesBisnisId: exceptProsesBisnisId } } : {}),
      },
    });
    if (duplicate > 0) {
      throw new ConflictException('Nama Proses Bisnis sudah digunakan pada lingkup yang sama');
    }
  }

  private async denganSiklus<T extends { prosesBisnisId: string }>(rows: T[]) {
    const siklusRows = await this.prisma.statusProsesBisnis.findMany({
      where: { prosesBisnisId: { in: rows.map((row) => row.prosesBisnisId) } },
    });
    const siklusById = new Map(siklusRows.map((row) => [row.prosesBisnisId, row]));
    return rows.map((row) => {
      const siklus = siklusById.get(row.prosesBisnisId);
      return {
        ...row,
        siklusStatus: siklus?.status ?? StatusKeaktifanProsesBisnis.ACTIVE,
        archivedAt: siklus?.archivedAt ?? null,
        archivedReason: siklus?.archivedReason ?? null,
      };
    });
  }

  private async cariUndanganAktif(token: string) {
    const undangan = await this.prisma.undanganAnggotaProsesBisnis.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (undangan === null || undangan.status !== StatusUndanganAnggotaProsesBisnis.PENDING) {
      throw new NotFoundException('Undangan tidak ditemukan atau sudah digunakan');
    }
    if (undangan.expiresAt <= new Date()) {
      await this.prisma.undanganAnggotaProsesBisnis.update({
        where: { undanganAnggotaProsesBisnisId: undangan.undanganAnggotaProsesBisnisId },
        data: { status: StatusUndanganAnggotaProsesBisnis.EXPIRED },
      });
      throw new ConflictException('Undangan sudah kedaluwarsa');
    }
    if (!(await this.isProsesBisnisActive(undangan.prosesBisnisId))) {
      throw new ConflictException('Proses Bisnis pada undangan sudah tidak aktif');
    }
    return undangan;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
