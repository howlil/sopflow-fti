import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import {
  resolvePagination,
  toPaginatedData,
  type PaginatedData,
} from '../../../common/utils/pagination.util';
import { JenisPengajuanEvaluasi, PeranPengguna, StatusSOP } from '../../../generated/prisma';
import { UserOpdAccessService } from '../../core/opd/user-opd-access.service';
import type { CreatePengajuanEvaluasiDto } from './dto/create-pengajuan-evaluasi.dto';
import type { PengajuanEvaluasiListQueryDto } from './dto/pengajuan-evaluasi-list-query.dto';
import type { PengajuanEvaluasiRingkasQueryDto } from './dto/pengajuan-evaluasi-ringkas-query.dto';
import type { PengajuanEvaluasiRingkasResponseDto } from './dto/pengajuan-evaluasi-ringkas-response.dto';
import { STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK } from './pengajuan-evaluasi-status.constants';
import {
  mapPengajuanEvaluasiRow,
  type PengajuanEvaluasiApiPayload,
} from './pengajuan-evaluasi.mapper';
import {
  PengajuanEvaluasiRepository,
  type PengajuanTransactionFailure,
} from './pengajuan-evaluasi.repository';

/** Detail SOP yang boleh dimasukkan pengajuan evaluasi baru (alur penyusun → evaluator). */
const STATUS_DETAIL_SIAP_PENGAJUAN_EVALUASI: readonly StatusSOP[] = [
  StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
] as const;

const statusSiapPengajuanEvaluasiSet = new Set<string>(STATUS_DETAIL_SIAP_PENGAJUAN_EVALUASI);

/** Satu baris pipeline workspace (detail terbaru per SOP) untuk bootstrap EVALUASI_REQUEST_OPD. */
export type BarisPipelineEvaluasiOpd = Readonly<{
  detailSopId: string;
  statusDetail: StatusSOP;
}>;

/**
 * Daftar & detail pengajuan evaluasi (REST) serta pembukaan pengajuan oleh PJ Penyusun.
 */
@Injectable()
export class PengajuanEvaluasiService {
  constructor(
    private readonly pengajuanEvaluasiRepository: PengajuanEvaluasiRepository,
    private readonly userOpdAccessService: UserOpdAccessService,
  ) {}

  /** Daftar pengajuan — PJ Penyusun & Kepala OPD otomatis dibatasi ke OPD-nya. */
  async findAll(
    user: JwtAccessPayload,
    query: PengajuanEvaluasiListQueryDto,
  ): Promise<PengajuanEvaluasiApiPayload[]> {
    const forcedOpdId = await this.resolveForcedOpdFilter(user);
    const whereInput = this.pengajuanEvaluasiRepository.buildWhereFromQuery(query, forcedOpdId);
    const rows = await this.pengajuanEvaluasiRepository.findManyFiltered(whereInput);
    return rows.map((row) => mapPengajuanEvaluasiRow(row, user.peran));
  }

  /** Daftar ringkas terpaginasi untuk dashboard evaluator / PJ (performa). */
  async findAllRingkas(
    user: JwtAccessPayload,
    query: PengajuanEvaluasiRingkasQueryDto,
  ): Promise<PaginatedData<PengajuanEvaluasiRingkasResponseDto>> {
    const forcedOpdId = await this.resolveForcedOpdFilter(user);
    const whereInput = this.pengajuanEvaluasiRepository.buildWhereRingkasFromQuery(
      query,
      forcedOpdId,
    );
    const { skip, take, page, limit } = resolvePagination(query);
    const [total, rows] = await Promise.all([
      this.pengajuanEvaluasiRepository.countWhere(whereInput),
      this.pengajuanEvaluasiRepository.findRingkasPage(whereInput, skip, take),
    ]);
    return toPaginatedData(rows, total, page, limit);
  }

  /** Satu pengajuan lengkap — PJ Penyusun/Kepala OPD hanya boleh mengakses OPD sendiri. */
  async findOne(
    user: JwtAccessPayload,
    pengajuanEvaluasiId: string,
  ): Promise<PengajuanEvaluasiApiPayload> {
    const row = await this.pengajuanEvaluasiRepository.findByIdFull(pengajuanEvaluasiId);
    if (row === null) {
      throw new NotFoundException('Pengajuan evaluasi tidak ditemukan');
    }
    await this.assertCanAccessPengajuan(user, row.opdId);
    return mapPengajuanEvaluasiRow(row, user.peran);
  }

  /** Membuka pengajuan evaluasi (SEDANG_DIEVALUASI + baris nilai per dokumen). Hanya PJ Penyusun OPD terkait. */
  async create(
    user: JwtAccessPayload,
    dto: CreatePengajuanEvaluasiDto,
  ): Promise<PengajuanEvaluasiApiPayload> {
    if (user.peran !== PeranPengguna.PJ_PENYUSUN) {
      throw new ForbiddenException('Hanya PJ Penyusun yang dapat membuka pengajuan evaluasi');
    }
    const opdIdPengguna = await this.userOpdAccessService.getRequiredUserOpdId(
      user.sub,
      'OPD pengguna tidak ditemukan',
    );
    const sopDetailIds = this.uniqueSopDetailIds(dto.sopDetailIds);
    const result = await this.pengajuanEvaluasiRepository.createPengajuanDenganLock({
      opdId: opdIdPengguna,
      jenis: dto.jenis,
      sopDetailIds,
      activeStatuses: STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK,
      eligibleDetailStatuses: STATUS_DETAIL_SIAP_PENGAJUAN_EVALUASI,
    });
    if (!result.ok) {
      this.throwTransactionFailure(
        result,
        'Anda',
        'Sebagian SOP tidak lagi berstatus MENUNGGU_PENGAJUAN_EVALUASI. Muat ulang daftar SOP lalu coba lagi.',
      );
    }
    const created = await this.pengajuanEvaluasiRepository.findByIdFull(result.pengajuanEvaluasiId);
    if (created === null) {
      throw new ConflictException('Gagal memuat pengajuan setelah pembuatan');
    }
    return mapPengajuanEvaluasiRow(created, user.peran);
  }

  /**
   * Untuk workspace evaluator: jika belum ada pengajuan aktif dan ada dokumen eligibel,
   * buat pengajuan `EVALUASI_REQUEST_OPD` + baris `NilaiEvaluasi` (tanpa menunggu PJ membuka pengajuan evaluasi).
   * No-op jika sudah ada pengajuan aktif atau pemanggil bukan EVALUATOR.
   */
  async pastikanPengajuanRequestOpdUntukEvaluator(
    user: JwtAccessPayload,
    opdId: string,
    pipelineRows: ReadonlyArray<BarisPipelineEvaluasiOpd>,
  ): Promise<void> {
    if (user.peran !== PeranPengguna.EVALUATOR) {
      return;
    }
    const sopDetailIds = pipelineRows
      .filter((row) => statusSiapPengajuanEvaluasiSet.has(String(row.statusDetail)))
      .map((row) => row.detailSopId);
    if (sopDetailIds.length === 0) {
      return;
    }
    const result = await this.pengajuanEvaluasiRepository.ensurePengajuanRequestOpdDenganLock({
      opdId,
      jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
      sopDetailIds,
      activeStatuses: STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK,
      eligibleDetailStatuses: STATUS_DETAIL_SIAP_PENGAJUAN_EVALUASI,
    });
    if (!result.ok) {
      this.throwTransactionFailure(
        result,
        '',
        'Sebagian SOP tidak lagi berstatus MENUNGGU_PENGAJUAN_EVALUASI. Muat ulang halaman lalu coba lagi.',
      );
    }
  }

  /** OPD terikat akun PJ Penyusun / Kepala OPD (untuk workspace tanpa param opdId). */
  async resolveOpdIdTerikat(user: JwtAccessPayload): Promise<string> {
    const opdId = await this.resolveForcedOpdFilter(user);
    if (opdId === undefined) {
      throw new ForbiddenException(
        'Hanya PJ Penyusun atau Kepala OPD yang dapat mengakses evaluasi OPD sendiri',
      );
    }
    return opdId;
  }

  private async resolveForcedOpdFilter(user: JwtAccessPayload): Promise<string | undefined> {
    if (user.peran === PeranPengguna.PJ_EVALUATOR || user.peran === PeranPengguna.EVALUATOR) {
      return undefined;
    }
    if (
      user.peran === PeranPengguna.PENYUSUN ||
      user.peran === PeranPengguna.PJ_PENYUSUN ||
      user.peran === PeranPengguna.KEPALA_OPD
    ) {
      return this.userOpdAccessService.getRequiredUserOpdId(
        user.sub,
        'OPD pengguna tidak ditemukan',
      );
    }
    throw new ForbiddenException('Peran tidak diizinkan mengakses daftar pengajuan evaluasi');
  }

  private uniqueSopDetailIds(sopDetailIds: readonly string[]): string[] {
    const uniqueIds = Array.from(new Set(sopDetailIds));
    if (uniqueIds.length !== sopDetailIds.length) {
      throw new BadRequestException('Daftar SOP tidak boleh berisi duplikasi');
    }
    return uniqueIds;
  }

  private throwTransactionFailure(
    failure: PengajuanTransactionFailure,
    ownerLabel: string,
    statusDriftMessage: string,
  ): never {
    if (failure.error === 'ACTIVE_EXISTS') {
      throw new ConflictException(
        'OPD ini masih memiliki pengajuan evaluasi aktif. Selesaikan atau tutup terlebih dahulu.',
      );
    }
    if (failure.error === 'DETAIL_NOT_FOUND') {
      const suffix = ownerLabel.length > 0 ? ` ${ownerLabel}.` : '.';
      throw new BadRequestException(
        `Detail SOP ${failure.detailSopId} tidak ditemukan atau bukan milik OPD${suffix}`,
      );
    }
    if (failure.error === 'DETAIL_BAD_STATUS') {
      throw new BadRequestException(
        `Detail SOP ${failure.detailSopId} berstatus ${String(failure.status)} dan tidak dapat dimasukkan pengajuan evaluasi.`,
      );
    }
    throw new ConflictException(statusDriftMessage);
  }

  /**
   * Validasi akses baca pengajuan (dipakai sub-resource dokumen SOP & Berita Acara).
   */
  async assertUserCanAccessPengajuan(
    user: JwtAccessPayload,
    pengajuanOpdId: string,
  ): Promise<void> {
    await this.assertCanAccessPengajuan(user, pengajuanOpdId);
  }

  private async assertCanAccessPengajuan(
    user: JwtAccessPayload,
    pengajuanOpdId: string,
  ): Promise<void> {
    if (user.peran === PeranPengguna.PJ_EVALUATOR || user.peran === PeranPengguna.EVALUATOR) {
      return;
    }
    if (
      user.peran === PeranPengguna.PENYUSUN ||
      user.peran === PeranPengguna.PJ_PENYUSUN ||
      user.peran === PeranPengguna.KEPALA_OPD
    ) {
      await this.userOpdAccessService.assertSameOpd(
        user.sub,
        pengajuanOpdId,
        'Anda tidak dapat mengakses pengajuan evaluasi OPD lain',
      );
      return;
    }
    throw new ForbiddenException('Peran tidak diizinkan mengakses detail pengajuan evaluasi');
  }
}
