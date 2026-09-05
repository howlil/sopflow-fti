import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertDetailSopEditable } from '../../../common/status/sop-editable.util';
import type { JwtAccessPayload } from '../../../common';
import { JenisLangkahProsedur, Prisma } from '../../../generated/prisma';
import { ProcessContextService } from '../../core/process/process-context.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import type { LangkahPatchItem } from './dto/langkah-patch-item.dto';
import type { UpdateSopProsedurDto } from './dto/update-sop-prosedur.dto';
import {
  SopProsedurRepository,
  type RepoLangkahPatchItem,
  type UpdateSopProsedurRepoInput,
} from './sop-prosedur.repository';

const MAX_UPDATE_PROSEDUR_TRANSACTION_ATTEMPTS = 5;
const UPDATE_PROSEDUR_RETRY_BASE_DELAY_MS = 40;

@Injectable()
export class SopProsedurService {
  constructor(
    private readonly sopProsedurRepository: SopProsedurRepository,
    private readonly sopWorkbenchReader: SopWorkbenchReader,
    private readonly processContextService: ProcessContextService,
  ) {}

  async updateProsedur(
    user: JwtAccessPayload,
    detailOrSopId: string,
    dto: UpdateSopProsedurDto,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    const resolved = await this.sopProsedurRepository.findDetailIdByDetailOrSopId(detailOrSopId);
    if (resolved === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }

    if (resolved.processId === null) {
      throw new ConflictException(
        'SOP belum memiliki Process ownership dan tidak tersedia pada endpoint native',
      );
    }
    await this.processContextService.assertCanAuthor(user.sub, resolved.processId);

    const detailStatus = await this.sopProsedurRepository.findDetailStatus(resolved.detailSopId);
    if (detailStatus === null) {
      throw new NotFoundException('DetailSOP tidak ditemukan');
    }
    assertDetailSopEditable(detailStatus);

    const changedFields = this.collectChangedFields(dto);
    if (changedFields.length === 0) {
      return this.getAuthorizedWorkbench(resolved.detailSopId, logsLimit);
    }

    const repoInput = await this.buildRepoInput(dto, resolved.detailSopId);

    try {
      await this.runUpdateProsedurTransactionWithRetry({
        detailSopId: resolved.detailSopId,
        userId: user.sub,
        input: repoInput,
        changedFields,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException('Konflik unik pada langkah/jalur pelaksana');
        }
        if (err.code === 'P2003' || err.code === 'P2025') {
          throw new BadRequestException('Referensi tidak valid pada muatan data');
        }
      }
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Langkah tujuan cabang')) {
        throw new BadRequestException('Langkah tujuan harus berada dalam DetailSOP yang sama');
      }
      if (message.includes('Pelaksana langkah harus dipilih sebagai swimlane')) {
        throw new BadRequestException(
          'Pelaksana langkah harus dipilih sebagai swimlane pada versi SOP yang sama',
        );
      }
      throw err;
    }

    return this.getAuthorizedWorkbench(resolved.detailSopId, logsLimit);
  }

  private async getAuthorizedWorkbench(
    detailSopId: string,
    logsLimit?: number,
  ): Promise<PenyusunWorkbenchDataDto> {
    return this.sopWorkbenchReader.getForDetail(detailSopId, logsLimit);
  }

  private async runUpdateProsedurTransactionWithRetry(params: {
    detailSopId: string;
    userId: string;
    input: UpdateSopProsedurRepoInput;
    changedFields: string[];
  }): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_UPDATE_PROSEDUR_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        await this.sopProsedurRepository.updateProsedurTransaction(params);
        return;
      } catch (err) {
        lastError = err;
        if (
          attempt === MAX_UPDATE_PROSEDUR_TRANSACTION_ATTEMPTS ||
          !isTransientTransactionError(err)
        ) {
          throw err;
        }
        await delay(UPDATE_PROSEDUR_RETRY_BASE_DELAY_MS * attempt);
      }
    }
    throw lastError;
  }

  private collectChangedFields(dto: UpdateSopProsedurDto): string[] {
    const out: string[] = [];
    if (dto.pelaksana !== undefined) out.push('pelaksana');
    if (dto.langkah !== undefined) out.push('langkah');
    return out;
  }

  private async buildRepoInput(
    dto: UpdateSopProsedurDto,
    detailSopId: string,
  ): Promise<UpdateSopProsedurRepoInput> {
    const out: UpdateSopProsedurRepoInput = {};
    let allowedPelaksanaIds: Set<string> | null = null;

    if (dto.pelaksana !== undefined) {
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const item of dto.pelaksana) {
        if (seen.has(item.pelaksanaId)) {
          throw new BadRequestException(
            `Pelaksana duplikat di jalur pelaksana: ${item.pelaksanaId}`,
          );
        }
        seen.add(item.pelaksanaId);
        ids.push(item.pelaksanaId);
      }

      const globalActors = await this.sopProsedurRepository.findGlobalPelaksana(ids);
      for (const id of ids) {
        if (!globalActors.has(id)) {
          throw new BadRequestException(`Pelaksana ${id} tidak ditemukan di katalog global`);
        }
      }

      out.pelaksana = ids.map((pelaksanaId) => ({
        pelaksanaId,
        namaSnapshot: globalActors.get(pelaksanaId)!,
      }));
      allowedPelaksanaIds = new Set(ids);

      if (dto.langkah === undefined) {
        const existingStepActors =
          await this.sopProsedurRepository.findExistingLangkahPelaksanaIds(detailSopId);
        for (const actorId of existingStepActors) {
          if (!allowedPelaksanaIds.has(actorId)) {
            throw new BadRequestException(
              'Jalur pelaksana tidak dapat menghapus actor yang masih digunakan langkah; perbarui langkah pada perubahan yang sama',
            );
          }
        }
      }
    }

    if (dto.langkah !== undefined) {
      const langkah = dto.langkah;
      const tempIds = new Set<string>();
      for (const item of langkah) {
        if (tempIds.has(item.tempId)) {
          throw new BadRequestException(`tempId duplikat: ${item.tempId}`);
        }
        tempIds.add(item.tempId);
      }

      let allowedForLangkah = allowedPelaksanaIds;
      if (allowedForLangkah === null) {
        const existing =
          await this.sopProsedurRepository.findExistingSwimlanePelaksanaIds(detailSopId);
        allowedForLangkah = new Set(existing);
      }

      const defaultPelaksanaId =
        out.pelaksana !== undefined && out.pelaksana.length > 0
          ? out.pelaksana[0].pelaksanaId
          : (Array.from(allowedForLangkah)[0] ?? null);

      out.langkah = langkah.map((item) =>
        this.toRepoLangkahItem(item, allowedForLangkah, tempIds, defaultPelaksanaId),
      );
      out.defaultPelaksanaId = defaultPelaksanaId;
    }

    return out;
  }

  private toRepoLangkahItem(
    item: LangkahPatchItem,
    allowedPelaksanaIds: Set<string>,
    knownTempIds: Set<string>,
    defaultPelaksanaId: string | null,
  ): RepoLangkahPatchItem {
    if (item.pelaksanaId !== undefined && !allowedPelaksanaIds.has(item.pelaksanaId)) {
      throw new BadRequestException(
        `pelaksanaId ${item.pelaksanaId} pada langkah '${item.tempId}' harus dipilih pada jalur pelaksana`,
      );
    }

    const isKeputusan = item.jenis === JenisLangkahProsedur.KEPUTUSAN;
    let yaTempId: string | null = null;
    let tidakTempId: string | null = null;
    if (isKeputusan) {
      if (
        item.langkahSelanjutnyaYaTempId !== undefined &&
        item.langkahSelanjutnyaYaTempId !== null &&
        !knownTempIds.has(item.langkahSelanjutnyaYaTempId)
      ) {
        throw new BadRequestException(
          `Cabang Ya pada langkah '${item.tempId}' merujuk tempId tidak dikenal: ${item.langkahSelanjutnyaYaTempId}`,
        );
      }
      if (
        item.langkahSelanjutnyaTidakTempId !== undefined &&
        item.langkahSelanjutnyaTidakTempId !== null &&
        !knownTempIds.has(item.langkahSelanjutnyaTidakTempId)
      ) {
        throw new BadRequestException(
          `Cabang Tidak pada langkah '${item.tempId}' merujuk tempId tidak dikenal: ${item.langkahSelanjutnyaTidakTempId}`,
        );
      }
      yaTempId = item.langkahSelanjutnyaYaTempId ?? null;
      tidakTempId = item.langkahSelanjutnyaTidakTempId ?? null;
    }

    const resolvedPelaksana = item.pelaksanaId ?? defaultPelaksanaId;
    if (resolvedPelaksana === null || resolvedPelaksana === undefined) {
      throw new BadRequestException(
        `Langkah '${item.tempId}' tidak punya pelaksana (jalur pelaksana kosong dan pelaksanaId tidak diset)`,
      );
    }

    return {
      tempId: item.tempId,
      jenis: item.jenis,
      kegiatan: item.kegiatan,
      kelengkapan: item.kelengkapan,
      keluaran: item.keluaran,
      waktu: item.waktu,
      satuanWaktu: item.satuanWaktu,
      keterangan: item.keterangan,
      pelaksanaId: resolvedPelaksana,
      langkahSelanjutnyaYaTempId: yaTempId,
      langkahSelanjutnyaTidakTempId: tidakTempId,
    };
  }
}

function isTransientTransactionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return err.code === 'P2034';
  }
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes('deadlock') ||
    message.includes('lock wait timeout') ||
    message.includes('write conflict') ||
    message.includes('transaction conflict')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
