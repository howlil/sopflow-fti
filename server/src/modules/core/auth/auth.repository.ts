import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { Prisma } from '../../../generated/prisma';

const authRecordSelect = {
  penggunaId: true,
  email: true,
  nama: true,
  kataSandi: true,
  platformRole: true,
  nip: true,
  jabatan: true,
  pangkat: true,
  nohp: true,
  sesiTokenVersion: true,
  refreshTokenHash: true,
  refreshTokenExpiresAt: true,
  ttePinHash: true,
  updatedAt: true,
} as const;

export type PenggunaAuthRecord = Prisma.PenggunaGetPayload<{
  select: typeof authRecordSelect;
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActivePenggunaByEmail(email: string): Promise<PenggunaAuthRecord | null> {
    return this.prisma.pengguna.findFirst({
      where: { email, deletedAt: null },
      select: authRecordSelect,
    });
  }

  async findActivePenggunaById(penggunaId: string): Promise<PenggunaAuthRecord | null> {
    return this.prisma.pengguna.findFirst({
      where: { penggunaId, deletedAt: null },
      select: authRecordSelect,
    });
  }

  async updateKataSandi(penggunaId: string, kataSandiHash: string): Promise<void> {
    await this.prisma.pengguna.update({
      where: { penggunaId },
      data: {
        kataSandi: kataSandiHash,
        passwordChangedAt: new Date(),
        sesiTokenVersion: { increment: 1 },
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }

  async updateNohp(penggunaId: string, nohp: string): Promise<PenggunaAuthRecord> {
    return this.prisma.pengguna.update({
      where: { penggunaId },
      data: { nohp },
      select: authRecordSelect,
    });
  }

  async startSession(penggunaId: string): Promise<PenggunaAuthRecord> {
    return this.prisma.pengguna.update({
      where: { penggunaId },
      data: {
        sesiTokenVersion: { increment: 1 },
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
      select: authRecordSelect,
    });
  }

  async storeRefreshToken(
    penggunaId: string,
    refreshTokenHash: string,
    refreshTokenExpiresAt: Date,
  ): Promise<PenggunaAuthRecord> {
    return this.prisma.pengguna.update({
      where: { penggunaId },
      data: { refreshTokenHash, refreshTokenExpiresAt },
      select: authRecordSelect,
    });
  }

  async revokeSession(penggunaId: string): Promise<void> {
    await this.prisma.pengguna.update({
      where: { penggunaId },
      data: {
        sesiTokenVersion: { increment: 1 },
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });
  }
}
