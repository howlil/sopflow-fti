import { Injectable } from '@nestjs/common';
import { JenisDokumenTte, PeranPengguna } from '../../../../generated/prisma';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type TtePenggunaRingkas = {
  readonly penggunaId: string;
  readonly email: string;
  readonly nama: string;
  readonly nip: string;
  readonly jabatan: string;
  readonly pangkat: string;
};

export type TteKredensialRow = {
  readonly hashPin: string;
  readonly p12Base64: string | null;
  readonly p12PassphraseEncrypted: string | null;
  readonly updatedAt: Date;
};

export type PdfSignatureMetadataInput = {
  readonly signatureValue: string;
  readonly signatureAlgorithm: string;
  readonly signatureFormat: string;
  readonly certSerialNumber: string;
  readonly certIssuer: string;
  readonly certSubject: string;
  readonly certFingerprint: string;
  readonly certValidFrom: Date;
  readonly certValidTo: Date;
};

export type PdfSignatureBindingRow = {
  readonly userId: string;
  readonly dokumenTteId: string;
  readonly peran: PeranPengguna;
  readonly ditandatanganiPada: Date;
  readonly signatureValue: string | null;
  readonly certSerialNumber: string | null;
  readonly certFingerprint: string | null;
  readonly dokumenTte: {
    readonly dokumenTteId: string;
    readonly nomorDokumen: string;
    readonly judulDokumen: string;
    readonly jenisDokumen: JenisDokumenTte;
    readonly hashDokumen: string;
  };
};

@Injectable()
export class TteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPenggunaAktif(userId: string): Promise<TtePenggunaRingkas | null> {
    return this.prisma.pengguna.findFirst({
      where: { penggunaId: userId, deletedAt: null },
      select: {
        penggunaId: true,
        email: true,
        nama: true,
        nip: true,
        jabatan: true,
        pangkat: true,
      },
    });
  }

  async findKredensial(userId: string): Promise<TteKredensialRow | null> {
    const row = await this.prisma.pengguna.findFirst({
      where: { penggunaId: userId, deletedAt: null },
      select: {
        ttePinHash: true,
        tteP12Base64: true,
        tteP12PassphraseEncrypted: true,
        updatedAt: true,
      },
    });
    if (row === null || row.ttePinHash === null) {
      return null;
    }
    return {
      hashPin: row.ttePinHash,
      p12Base64: row.tteP12Base64,
      p12PassphraseEncrypted: row.tteP12PassphraseEncrypted,
      updatedAt: row.updatedAt,
    };
  }

  async createKredensialPin(params: {
    userId: string;
    hashPin: string;
  }): Promise<TteKredensialRow> {
    const row = await this.prisma.pengguna.update({
      where: { penggunaId: params.userId },
      data: { ttePinHash: params.hashPin },
      select: {
        ttePinHash: true,
        tteP12Base64: true,
        tteP12PassphraseEncrypted: true,
        updatedAt: true,
      },
    });
    return {
      hashPin: row.ttePinHash!,
      p12Base64: row.tteP12Base64,
      p12PassphraseEncrypted: row.tteP12PassphraseEncrypted,
      updatedAt: row.updatedAt,
    };
  }

  async createKredensialPinDanP12(params: {
    userId: string;
    hashPin: string;
    p12Base64: string;
    p12PassphraseEncrypted: string;
  }): Promise<TteKredensialRow> {
    const row = await this.prisma.pengguna.update({
      where: { penggunaId: params.userId },
      data: {
        ttePinHash: params.hashPin,
        tteP12Base64: params.p12Base64,
        tteP12PassphraseEncrypted: params.p12PassphraseEncrypted,
      },
      select: {
        ttePinHash: true,
        tteP12Base64: true,
        tteP12PassphraseEncrypted: true,
        updatedAt: true,
      },
    });
    return {
      hashPin: row.ttePinHash!,
      p12Base64: row.tteP12Base64,
      p12PassphraseEncrypted: row.tteP12PassphraseEncrypted,
      updatedAt: row.updatedAt,
    };
  }

  async updateKredensialPinHash(params: {
    userId: string;
    hashPin: string;
  }): Promise<TteKredensialRow> {
    const row = await this.prisma.pengguna.update({
      where: { penggunaId: params.userId },
      data: { ttePinHash: params.hashPin },
      select: {
        ttePinHash: true,
        tteP12Base64: true,
        tteP12PassphraseEncrypted: true,
        updatedAt: true,
      },
    });
    if (row.ttePinHash === null) {
      throw new Error('Kredensial TTE tidak ditemukan setelah pembaruan');
    }
    return {
      hashPin: row.ttePinHash,
      p12Base64: row.tteP12Base64,
      p12PassphraseEncrypted: row.tteP12PassphraseEncrypted,
      updatedAt: row.updatedAt,
    };
  }

  async updateKredensialP12(params: {
    userId: string;
    p12Base64: string;
    p12PassphraseEncrypted: string;
  }): Promise<TteKredensialRow> {
    const row = await this.prisma.pengguna.update({
      where: { penggunaId: params.userId },
      data: {
        tteP12Base64: params.p12Base64,
        tteP12PassphraseEncrypted: params.p12PassphraseEncrypted,
      },
      select: {
        ttePinHash: true,
        tteP12Base64: true,
        tteP12PassphraseEncrypted: true,
        updatedAt: true,
      },
    });
    if (row.ttePinHash === null) {
      throw new Error('Kredensial TTE tidak ditemukan (belum ada PIN)');
    }
    return {
      hashPin: row.ttePinHash,
      p12Base64: row.tteP12Base64,
      p12PassphraseEncrypted: row.tteP12PassphraseEncrypted,
      updatedAt: row.updatedAt,
    };
  }

  async findRiwayatPengesahanByUserAndDokumen(userId: string, dokumenTteId: string) {
    return this.prisma.riwayatTandaTangan.findUnique({
      where: { userId_dokumenTteId: { userId, dokumenTteId } },
      select: {
        userId: true,
        dokumenTteId: true,
        peran: true,
        ditandatanganiPada: true,
        dokumenTte: {
          select: {
            dokumenTteId: true,
            nomorDokumen: true,
            judulDokumen: true,
            hashDokumen: true,
            jenisDokumen: true,
            detailSopId: true,
            processId: true,
          },
        },
        user: { select: { penggunaId: true, nama: true, nip: true, jabatan: true } },
      },
    });
  }

  async findRiwayatForPdfSigning(userId: string, dokumenTteId: string) {
    return this.prisma.riwayatTandaTangan.findUnique({
      where: { userId_dokumenTteId: { userId, dokumenTteId } },
      select: {
        userId: true,
        dokumenTteId: true,
        peran: true,
        ditandatanganiPada: true,
        dokumenTte: {
          select: {
            dokumenTteId: true,
            nomorDokumen: true,
            judulDokumen: true,
            jenisDokumen: true,
          },
        },
        user: { select: { penggunaId: true, nama: true, nip: true, jabatan: true } },
      },
    });
  }

  async updateRiwayatPdfSignatureMetadata(params: {
    userId: string;
    dokumenTteId: string;
    metadata: PdfSignatureMetadataInput;
  }): Promise<void> {
    await this.prisma.riwayatTandaTangan.update({
      where: {
        userId_dokumenTteId: {
          userId: params.userId,
          dokumenTteId: params.dokumenTteId,
        },
      },
      data: {
        signatureValue: params.metadata.signatureValue,
        signatureAlgorithm: params.metadata.signatureAlgorithm,
        signatureFormat: params.metadata.signatureFormat,
        certSerialNumber: params.metadata.certSerialNumber,
        certIssuer: params.metadata.certIssuer,
        certSubject: params.metadata.certSubject,
        certFingerprint: params.metadata.certFingerprint,
        certValidFrom: params.metadata.certValidFrom,
        certValidTo: params.metadata.certValidTo,
      },
    });
  }

  async findRiwayatByPdfSignatureBinding(params: {
    userId: string;
    dokumenTteId: string;
  }): Promise<PdfSignatureBindingRow | null> {
    return this.prisma.riwayatTandaTangan.findUnique({
      where: {
        userId_dokumenTteId: {
          userId: params.userId,
          dokumenTteId: params.dokumenTteId,
        },
      },
      select: {
        userId: true,
        dokumenTteId: true,
        peran: true,
        ditandatanganiPada: true,
        signatureValue: true,
        certSerialNumber: true,
        certFingerprint: true,
        dokumenTte: {
          select: {
            dokumenTteId: true,
            nomorDokumen: true,
            judulDokumen: true,
            jenisDokumen: true,
            hashDokumen: true,
          },
        },
      },
    });
  }
}
