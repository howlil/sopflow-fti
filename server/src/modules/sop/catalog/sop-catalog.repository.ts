import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TERMINAL_DETAIL_STATUSES } from '../../../common/status/sop-editable.util';
import { BagianSOP, Prisma, StatusSOP } from '../../../generated/prisma';
import { appendOrCreateLogSession } from '../collaboration/log-edit-session.helper';
import {
  sopCatalogRepoFail,
  sopCatalogRepoOk,
  type SopCatalogRepoResult,
} from './sop-catalog.repo-result';

export interface UpdateSopHeaderRepoInput {
  judul?: string;
  nomorSOP?: string;
  namaLembaga?: string;
  dasarHukumPeraturanIds?: string[];
  sopTerkaitDetailIds?: string[];
  lampiran?: {
    peringatan?: string[];
    kualifikasiPelaksanaan?: string[];
    peralatanPerlengkapan?: string[];
    pencatatanPendataan?: string[];
  };
}

const buildWorkbenchInclude = (logsLimit: number) =>
  ({
    sop: {
      select: {
        sopId: true,
        processId: true,
        judul: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    dibuatOleh: { select: { penggunaId: true, nama: true } },
    terakhirDieditOleh: { select: { penggunaId: true, nama: true } },
    revisiDari: { select: { detailSopId: true, versi: true } },
    lampiranPeringatan: true,
    lampiranKualifikasiPelaksanaan: true,
    lampiranPeralatanPerlengkapan: true,
    lampiranPencatatanPendataan: true,
    dasarHukum: { include: { peraturan: true } },
    relasiSopKeluar: {
      include: {
        sopTerkait: { include: { sop: { select: { judul: true, sopId: true } } } },
      },
    },
    relasiSopMasuk: {
      include: {
        sop: { include: { sop: { select: { judul: true, sopId: true } } } },
      },
    },
    dokumenTte: {
      where: { jenisDokumen: 'SOP_BERLAKU' },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: {
        dokumenTteId: true,
        riwayatTandaTangan: {
          orderBy: { ditandatanganiPada: 'desc' },
          take: 1,
          select: {
            userId: true,
            dokumenTteId: true,
            ditandatanganiPada: true,
            user: { select: { nama: true, nip: true, jabatan: true } },
          },
        },
      },
    },
    swimlanes: { include: { pelaksana: true } },
    langkahSOP: { orderBy: { urutan: 'asc' }, include: { pelaksana: true } },
    logEditSop: {
      orderBy: { createdAt: 'desc' },
      take: logsLimit,
      include: {
        domainFields: true,
        pengguna: { select: { penggunaId: true, nama: true, email: true } },
      },
    },
    konfigurasiDiagram: {
      include: {
        overridePanah: {
          include: {
            titikTekuk: { orderBy: { urutan: 'asc' } },
          },
        },
        overrideLabel: true,
      },
    },
  }) satisfies Prisma.DetailSOPInclude;

export type SopWorkbenchDbPayload = Prisma.DetailSOPGetPayload<{
  include: ReturnType<typeof buildWorkbenchInclude>;
}>;

export type SopDaftarDetailSlice = {
  detailSopId: string;
  nomorSOP: string;
  status: StatusSOP;
  versi: number;
  updatedAt: Date;
  pembuatNama: string | null;
  editorNama: string | null;
  peraturanId: string | null;
};

export type SopDaftarDbRow = {
  sopId: string;
  judul: string;
  detail: SopDaftarDetailSlice | undefined;
  versiBerlaku: SopDaftarDetailSlice | null;
  allStatuses: StatusSOP[];
};

export type SopRiwayatVersiDbRow = {
  detailSopId: string;
  versi: number;
  nomorSOP: string;
  status: StatusSOP;
  revisiDariDetailSopId: string | null;
  revisiDariVersi: number | null;
  updatedAt: Date;
  canHapusDraft: boolean;
};

export interface SopDaftarListFilters {
  readonly status?: string;
  readonly tanggalDari?: string;
  readonly tanggalSampai?: string;
}

@Injectable()
export class SopCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private static isoDateUtc(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private applyDaftarFilters(
    rows: SopDaftarDbRow[],
    filters: SopDaftarListFilters,
  ): SopDaftarDbRow[] {
    const hasStatus = filters.status !== undefined && filters.status.length > 0;
    const hasDari = filters.tanggalDari !== undefined && filters.tanggalDari.length > 0;
    const hasSampai = filters.tanggalSampai !== undefined && filters.tanggalSampai.length > 0;
    if (!hasStatus && !hasDari && !hasSampai) return rows;

    return rows.filter((row) => {
      const detail = row.detail;
      if (detail === undefined) return false;
      if (hasStatus && detail.status !== filters.status) return false;
      const day = SopCatalogRepository.isoDateUtc(detail.updatedAt);
      if (hasDari && day < filters.tanggalDari) return false;
      if (hasSampai && day > filters.tanggalSampai) return false;
      return true;
    });
  }

  private mapDetailSlice(detail: {
    detailSopId: string;
    nomorSOP: string;
    status: StatusSOP;
    versi: number;
    updatedAt: Date;
    dibuatOleh: { nama: string } | null;
    terakhirDieditOleh: { nama: string } | null;
    dasarHukum: { peraturanId: string }[];
  }): SopDaftarDetailSlice {
    return {
      detailSopId: detail.detailSopId,
      nomorSOP: detail.nomorSOP,
      status: detail.status,
      versi: detail.versi,
      updatedAt: detail.updatedAt,
      pembuatNama: detail.dibuatOleh?.nama ?? null,
      editorNama: detail.terakhirDieditOleh?.nama ?? null,
      peraturanId: detail.dasarHukum[0]?.peraturanId ?? null,
    };
  }

  private mapSopDaftarRow(row: {
    sopId: string;
    judul: string;
    detailSops: Array<{
      detailSopId: string;
      nomorSOP: string;
      status: StatusSOP;
      versi: number;
      updatedAt: Date;
      dibuatOleh: { nama: string } | null;
      terakhirDieditOleh: { nama: string } | null;
      dasarHukum: { peraturanId: string }[];
    }>;
  }): SopDaftarDbRow {
    const sorted = [...row.detailSops].sort((a, b) => b.versi - a.versi);
    const latest = sorted[0];
    const effective = sorted.find((detail) => detail.status === StatusSOP.BERLAKU);
    return {
      sopId: row.sopId,
      judul: row.judul,
      detail: latest === undefined ? undefined : this.mapDetailSlice(latest),
      versiBerlaku: effective === undefined ? null : this.mapDetailSlice(effective),
      allStatuses: sorted.map((detail) => detail.status),
    };
  }

  private static deriveNomorSopVersiBaru(nomorLama: string, versiBaru: number): string {
    const match = nomorLama.match(/^(.+)-V\d+$/i);
    const base = match !== null ? match[1] : nomorLama;
    return `${base}-V${versiBaru}`;
  }

  async findWorkbenchPayload(
    detailSopId: string,
    logsLimit: number,
  ): Promise<SopWorkbenchDbPayload | null> {
    return this.prisma.detailSOP.findUnique({
      where: { detailSopId },
      include: buildWorkbenchInclude(logsLimit),
    });
  }

  async findWorkbenchPayloadByDetailOrSopId(
    detailOrSopId: string,
    logsLimit: number,
  ): Promise<SopWorkbenchDbPayload | null> {
    const direct = await this.findWorkbenchPayload(detailOrSopId, logsLimit);
    if (direct !== null) return direct;

    const header = await this.prisma.sOP.findUnique({
      where: { sopId: detailOrSopId },
      select: {
        detailSops: {
          orderBy: { versi: 'desc' },
          take: 1,
          select: { detailSopId: true },
        },
      },
    });
    const latestDetailId = header?.detailSops[0]?.detailSopId;
    return latestDetailId === undefined
      ? null
      : this.findWorkbenchPayload(latestDetailId, logsLimit);
  }

  async findDetailIdByDetailOrSopId(
    detailOrSopId: string,
  ): Promise<{ detailSopId: string; sopId: string; processId: string | null } | null> {
    const direct = await this.prisma.detailSOP.findUnique({
      where: { detailSopId: detailOrSopId },
      select: {
        detailSopId: true,
        sopId: true,
        sop: { select: { processId: true } },
      },
    });
    if (direct !== null) {
      return {
        detailSopId: direct.detailSopId,
        sopId: direct.sopId,
        processId: direct.sop.processId,
      };
    }

    const header = await this.prisma.sOP.findUnique({
      where: { sopId: detailOrSopId },
      select: {
        sopId: true,
        processId: true,
        detailSops: {
          orderBy: { versi: 'desc' },
          take: 1,
          select: { detailSopId: true },
        },
      },
    });
    const latest = header?.detailSops[0]?.detailSopId;
    if (header === null || latest === undefined) return null;
    return { detailSopId: latest, sopId: header.sopId, processId: header.processId };
  }

  async findLatestDetailStatusContext(detailOrSopId: string): Promise<{
    detailSopId: string;
    sopId: string;
    status: StatusSOP;
    processId: string | null;
  } | null> {
    const resolved = await this.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) return null;

    const row = await this.prisma.detailSOP.findUnique({
      where: { detailSopId: resolved.detailSopId },
      select: {
        detailSopId: true,
        sopId: true,
        status: true,
        sop: { select: { processId: true } },
      },
    });
    if (row === null) return null;
    return {
      detailSopId: row.detailSopId,
      sopId: row.sopId,
      status: row.status,
      processId: row.sop.processId,
    };
  }

  async updateSopHeaderTransaction(params: {
    detailSopId: string;
    sopId: string;
    userId: string;
    input: UpdateSopHeaderRepoInput;
    changedFields: string[];
  }): Promise<SopCatalogRepoResult<void>> {
    const { detailSopId, sopId, userId, input, changedFields } = params;
    await this.prisma.$transaction(async (tx) => {
      if (input.judul !== undefined) {
        await tx.sOP.update({
          where: { sopId },
          data: { judul: input.judul.trim() },
        });
      }

      const detailData: Prisma.DetailSOPUncheckedUpdateInput = {
        terakhirDieditOlehId: userId,
      };
      if (input.nomorSOP !== undefined) detailData.nomorSOP = input.nomorSOP.trim();
      if (input.namaLembaga !== undefined) detailData.namaLembaga = input.namaLembaga;
      await tx.detailSOP.update({ where: { detailSopId }, data: detailData });

      if (input.dasarHukumPeraturanIds !== undefined) {
        await tx.dasarHukum.deleteMany({ where: { detailSopId } });
        const uniqueIds = Array.from(new Set(input.dasarHukumPeraturanIds));
        if (uniqueIds.length > 0) {
          await tx.dasarHukum.createMany({
            data: uniqueIds.map((peraturanId) => ({ detailSopId, peraturanId })),
            skipDuplicates: true,
          });
        }
      }

      if (input.sopTerkaitDetailIds !== undefined) {
        await tx.sopTerkait.deleteMany({ where: { detailSopId } });
        const uniqueIds = Array.from(
          new Set(input.sopTerkaitDetailIds.filter((id) => id !== detailSopId)),
        );
        if (uniqueIds.length > 0) {
          await tx.sopTerkait.createMany({
            data: uniqueIds.map((detailSopTerkaitId) => ({ detailSopId, detailSopTerkaitId })),
            skipDuplicates: true,
          });
        }
      }

      if (input.lampiran?.peringatan !== undefined) {
        await tx.lampiranPeringatan.deleteMany({ where: { detailSopId } });
        const cleaned = input.lampiran.peringatan.map((item) => item.trim()).filter(Boolean);
        if (cleaned.length > 0) {
          await tx.lampiranPeringatan.createMany({
            data: cleaned.map((teks) => ({ detailSopId, teks })),
          });
        }
      }

      if (input.lampiran?.kualifikasiPelaksanaan !== undefined) {
        await tx.lampiranKualifikasiPelaksanaan.deleteMany({ where: { detailSopId } });
        const cleaned = input.lampiran.kualifikasiPelaksanaan
          .map((item) => item.trim())
          .filter(Boolean);
        if (cleaned.length > 0) {
          await tx.lampiranKualifikasiPelaksanaan.createMany({
            data: cleaned.map((teks) => ({ detailSopId, teks })),
          });
        }
      }

      if (input.lampiran?.peralatanPerlengkapan !== undefined) {
        await tx.lampiranPeralatanPerlengkapan.deleteMany({ where: { detailSopId } });
        const cleaned = input.lampiran.peralatanPerlengkapan
          .map((item) => item.trim())
          .filter(Boolean);
        if (cleaned.length > 0) {
          await tx.lampiranPeralatanPerlengkapan.createMany({
            data: cleaned.map((teks) => ({ detailSopId, teks })),
          });
        }
      }

      if (input.lampiran?.pencatatanPendataan !== undefined) {
        await tx.lampiranPencatatanPendataan.deleteMany({ where: { detailSopId } });
        const cleaned = input.lampiran.pencatatanPendataan
          .map((item) => item.trim())
          .filter(Boolean);
        if (cleaned.length > 0) {
          await tx.lampiranPencatatanPendataan.createMany({
            data: cleaned.map((teks) => ({ detailSopId, teks })),
          });
        }
      }

      await appendOrCreateLogSession({
        tx,
        detailSopId,
        penggunaId: userId,
        bagian: BagianSOP.HEADER,
        fields: changedFields,
      });
    });
    return sopCatalogRepoOk(undefined);
  }

  async findDaftarAll(filters: SopDaftarListFilters = {}): Promise<SopDaftarDbRow[]> {
    const rows = await this.prisma.sOP.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        sopId: true,
        judul: true,
        detailSops: {
          orderBy: { versi: 'desc' },
          select: {
            detailSopId: true,
            nomorSOP: true,
            status: true,
            versi: true,
            updatedAt: true,
            dibuatOleh: { select: { nama: true } },
            terakhirDieditOleh: { select: { nama: true } },
            dasarHukum: {
              orderBy: { createdAt: 'asc' },
              take: 1,
              select: { peraturanId: true },
            },
          },
        },
      },
    });
    return this.applyDaftarFilters(rows.map((row) => this.mapSopDaftarRow(row)), filters);
  }

  async findRiwayatVersiBySopId(sopId: string): Promise<SopRiwayatVersiDbRow[]> {
    const rows = await this.prisma.detailSOP.findMany({
      where: { sopId },
      orderBy: { versi: 'asc' },
      select: {
        detailSopId: true,
        versi: true,
        nomorSOP: true,
        status: true,
        revisiDariDetailSopId: true,
        updatedAt: true,
        revisiDari: { select: { versi: true } },
      },
    });
    return rows.map((row) => ({
      detailSopId: row.detailSopId,
      versi: row.versi,
      nomorSOP: row.nomorSOP,
      status: row.status,
      revisiDariDetailSopId: row.revisiDariDetailSopId,
      revisiDariVersi: row.revisiDari?.versi ?? null,
      updatedAt: row.updatedAt,
      canHapusDraft: row.status === StatusSOP.DRAFT && row.revisiDariDetailSopId !== null,
    }));
  }

  async cloneDetailSopFromSource(params: {
    sourceDetailSopId: string;
    penggunaId: string;
  }): Promise<SopCatalogRepoResult<{ detailSopId: string; versi: number }>> {
    const source = await this.prisma.detailSOP.findUnique({
      where: { detailSopId: params.sourceDetailSopId },
      include: {
        lampiranPeringatan: true,
        lampiranKualifikasiPelaksanaan: true,
        lampiranPeralatanPerlengkapan: true,
        lampiranPencatatanPendataan: true,
        dasarHukum: true,
        swimlanes: true,
        relasiSopKeluar: true,
        relasiSopMasuk: true,
        langkahSOP: { orderBy: { urutan: 'asc' } },
      },
    });
    if (source === null) {
      return sopCatalogRepoFail('NOT_FOUND', 'DetailSOP sumber tidak ditemukan');
    }
    if (!TERMINAL_DETAIL_STATUSES.has(source.status)) {
      return sopCatalogRepoFail(
        'CONFLICT',
        'Hanya versi terminal yang dapat dijadikan sumber versi baru',
      );
    }

    const siblings = await this.prisma.detailSOP.findMany({
      where: { sopId: source.sopId },
      select: { status: true, versi: true },
    });
    if (siblings.some((sibling) => !TERMINAL_DETAIL_STATUSES.has(sibling.status))) {
      return sopCatalogRepoFail(
        'CONFLICT',
        'Masih ada versi revisi yang belum selesai. Selesaikan atau batalkan revisi tersebut terlebih dahulu.',
      );
    }

    const versiBaru = siblings.reduce((max, sibling) => Math.max(max, sibling.versi), 0) + 1;
    const nomorSOP = SopCatalogRepository.deriveNomorSopVersiBaru(source.nomorSOP, versiBaru);
    const now = new Date();

    const cloned = await this.prisma.$transaction(async (tx) => {
      const created = await tx.detailSOP.create({
        data: {
          sopId: source.sopId,
          versi: versiBaru,
          status: StatusSOP.DRAFT,
          nomorSOP,
          namaLembaga: source.namaLembaga,
          tanggalPembuatan: now,
          tanggalRevisi: now,
          tanggalEfektif: null,
          dibuatOlehId: params.penggunaId,
          terakhirDieditOlehId: params.penggunaId,
          revisiDariDetailSopId: source.detailSopId,
        },
      });
      const newDetailId = created.detailSopId;

      if (source.lampiranPeringatan.length > 0) {
        await tx.lampiranPeringatan.createMany({
          data: source.lampiranPeringatan.map((item) => ({ detailSopId: newDetailId, teks: item.teks })),
        });
      }
      if (source.lampiranKualifikasiPelaksanaan.length > 0) {
        await tx.lampiranKualifikasiPelaksanaan.createMany({
          data: source.lampiranKualifikasiPelaksanaan.map((item) => ({
            detailSopId: newDetailId,
            teks: item.teks,
          })),
        });
      }
      if (source.lampiranPeralatanPerlengkapan.length > 0) {
        await tx.lampiranPeralatanPerlengkapan.createMany({
          data: source.lampiranPeralatanPerlengkapan.map((item) => ({
            detailSopId: newDetailId,
            teks: item.teks,
          })),
        });
      }
      if (source.lampiranPencatatanPendataan.length > 0) {
        await tx.lampiranPencatatanPendataan.createMany({
          data: source.lampiranPencatatanPendataan.map((item) => ({
            detailSopId: newDetailId,
            teks: item.teks,
          })),
        });
      }
      if (source.dasarHukum.length > 0) {
        await tx.dasarHukum.createMany({
          data: source.dasarHukum.map((item) => ({
            detailSopId: newDetailId,
            peraturanId: item.peraturanId,
          })),
        });
      }
      if (source.swimlanes.length > 0) {
        await tx.detailSOPPelaksana.createMany({
          data: source.swimlanes.map((item) => ({
            detailSopId: newDetailId,
            pelaksanaId: item.pelaksanaId,
            urutan: item.urutan,
          })),
        });
      }
      for (const rel of source.relasiSopKeluar) {
        await tx.sopTerkait.create({
          data: { detailSopId: newDetailId, detailSopTerkaitId: rel.detailSopTerkaitId },
        });
      }
      for (const rel of source.relasiSopMasuk) {
        await tx.sopTerkait.create({
          data: { detailSopId: rel.detailSopId, detailSopTerkaitId: newDetailId },
        });
      }

      const langkahIdMap = new Map<string, string>();
      for (const step of source.langkahSOP) {
        const createdStep = await tx.langkahSOP.create({
          data: {
            detailSopId: newDetailId,
            urutan: step.urutan,
            kegiatan: step.kegiatan,
            jenis: step.jenis,
            kelengkapan: step.kelengkapan,
            keluaran: step.keluaran,
            waktu: step.waktu,
            satuanWaktu: step.satuanWaktu,
            keterangan: step.keterangan,
            pelaksanaId: step.pelaksanaId,
          },
        });
        langkahIdMap.set(step.langkahSopId, createdStep.langkahSopId);
      }
      for (const step of source.langkahSOP) {
        const newId = langkahIdMap.get(step.langkahSopId);
        if (newId === undefined) continue;
        const yaId =
          step.langkahSelanjutnyaYaId === null
            ? null
            : (langkahIdMap.get(step.langkahSelanjutnyaYaId) ?? null);
        const tidakId =
          step.langkahSelanjutnyaTidakId === null
            ? null
            : (langkahIdMap.get(step.langkahSelanjutnyaTidakId) ?? null);
        if (step.langkahSelanjutnyaYaId !== null || step.langkahSelanjutnyaTidakId !== null) {
          await tx.langkahSOP.update({
            where: { langkahSopId: newId },
            data: { langkahSelanjutnyaYaId: yaId, langkahSelanjutnyaTidakId: tidakId },
          });
        }
      }

      const sourceDiagramConfigs = await tx.konfigurasiDiagramSOP.findMany({
        where: { detailSopId: params.sourceDetailSopId },
        include: {
          overridePanah: { include: { titikTekuk: { orderBy: { urutan: 'asc' } } } },
          overrideLabel: true,
        },
      });
      for (const config of sourceDiagramConfigs) {
        await tx.konfigurasiDiagramSOP.create({
          data: {
            detailSopId: newDetailId,
            jenis: config.jenis,
            layoutSeed: config.layoutSeed,
          },
        });
        for (const edge of config.overridePanah) {
          const newFrom = langkahIdMap.get(edge.dariLangkahSopId);
          const newTo = langkahIdMap.get(edge.keLangkahSopId);
          if (newFrom === undefined || newTo === undefined) continue;
          await tx.overridePanahDiagramSOP.create({
            data: {
              detailSopId: newDetailId,
              jenis: config.jenis,
              dariLangkahSopId: newFrom,
              keLangkahSopId: newTo,
              cabang: edge.cabang,
              sSide: edge.sSide,
              eSide: edge.eSide,
              startX: edge.startX,
              startY: edge.startY,
              endX: edge.endX,
              endY: edge.endY,
            },
          });
          if (edge.titikTekuk.length > 0) {
            await tx.titikTekukPanahDiagramSOP.createMany({
              data: edge.titikTekuk.map((point) => ({
                detailSopId: newDetailId,
                jenis: config.jenis,
                dariLangkahSopId: newFrom,
                keLangkahSopId: newTo,
                cabang: edge.cabang,
                urutan: point.urutan,
                x: point.x,
                y: point.y,
              })),
            });
          }
        }
        if (config.overrideLabel.length > 0) {
          await tx.overrideLabelDiagramSOP.createMany({
            data: config.overrideLabel.map((label) => ({
              detailSopId: newDetailId,
              jenis: config.jenis,
              kunciLabel: label.kunciLabel,
              posisiX: label.posisiX,
              posisiY: label.posisiY,
            })),
          });
        }
      }

      await tx.logEditSOP.create({
        data: {
          detailSopId: newDetailId,
          penggunaId: params.penggunaId,
          createdAt: now,
          bagian: BagianSOP.STATUS,
          keterangan: `Versi ${versiBaru} dibuat berdasarkan versi ${source.versi}`,
          sesiChangeCount: 1,
          closedAt: now,
          domainFields: {
            create: [{ domainField: 'create' }, { domainField: 'revisiDariDetailSopId' }],
          },
        },
      });
      return { detailSopId: newDetailId, versi: versiBaru };
    });

    return sopCatalogRepoOk(cloned);
  }

  async deleteVersiDraft(detailSopId: string): Promise<SopCatalogRepoResult<void>> {
    const row = await this.prisma.detailSOP.findUnique({
      where: { detailSopId },
      select: { status: true, revisiDariDetailSopId: true },
    });
    if (row === null) return sopCatalogRepoFail('NOT_FOUND', 'DetailSOP tidak ditemukan');
    if (row.status !== StatusSOP.DRAFT) {
      return sopCatalogRepoFail('CONFLICT', 'Hanya versi berstatus DRAFT yang dapat dihapus');
    }
    if (row.revisiDariDetailSopId === null) {
      return sopCatalogRepoFail(
        'CONFLICT',
        'Hanya versi revisi yang dibuat dari versi sebelumnya yang dapat dihapus lewat endpoint ini',
      );
    }
    await this.prisma.detailSOP.delete({ where: { detailSopId } });
    return sopCatalogRepoOk(undefined);
  }

  async deleteSopDraftAwal(detailSopId: string): Promise<SopCatalogRepoResult<void>> {
    const row = await this.prisma.detailSOP.findUnique({
      where: { detailSopId },
      select: {
        sopId: true,
        status: true,
        versi: true,
        revisiDariDetailSopId: true,
        sop: { select: { _count: { select: { detailSops: true } } } },
      },
    });
    if (row === null) return sopCatalogRepoFail('NOT_FOUND', 'DetailSOP tidak ditemukan');
    if (
      row.status !== StatusSOP.DRAFT ||
      row.versi !== 1 ||
      row.revisiDariDetailSopId !== null ||
      row.sop._count.detailSops !== 1
    ) {
      return sopCatalogRepoFail(
        'CONFLICT',
        'SOP hanya dapat dihapus ketika masih berupa draft awal dan belum memiliki versi lain',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.detailSOP.delete({ where: { detailSopId } });
      await tx.sOP.delete({ where: { sopId: row.sopId } });
    });
    return sopCatalogRepoOk(undefined);
  }
}
