import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import {
  JenisPengajuanEvaluasi,
  PeranPengguna,
  StatusPengajuanEvaluasi,
  StatusSOP,
} from '../../../generated/prisma';
import { UserOpdAccessService } from '../../core/opd/user-opd-access.service';
import { STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK } from './pengajuan-evaluasi-status.constants';
import type {
  PengajuanEvaluasiDetailRow,
  PengajuanEvaluasiRepository,
} from './pengajuan-evaluasi.repository';
import { PengajuanEvaluasiService } from './pengajuan-evaluasi.service';

function buildService(
  repository: PengajuanEvaluasiRepository,
  accessOverrides?: Partial<{
    getRequiredUserOpdId: jest.Mock;
    assertSameOpd: jest.Mock;
  }>,
): PengajuanEvaluasiService {
  const accessService = {
    getRequiredUserOpdId: jest.fn().mockResolvedValue('opd-a'),
    assertSameOpd: jest.fn().mockResolvedValue(undefined),
    ...accessOverrides,
  } as unknown as UserOpdAccessService;
  return new PengajuanEvaluasiService(repository, accessService);
}

function buildPengajuanRow(
  overrides: Partial<PengajuanEvaluasiDetailRow> = {},
): PengajuanEvaluasiDetailRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    pengajuanEvaluasiId: 'peng-1',
    opdId: 'opd-a',
    jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
    status: StatusPengajuanEvaluasi.SEDANG_DIEVALUASI,
    nomorBA: null,
    tanggalPermintaan: now,
    tanggalEvaluasi: now,
    nilaiOPD: null,
    diverifikasiOlehUserId: null,
    diselesaikanOlehId: null,
    ditolakOlehId: null,
    alasanPenolakan: null,
    tanggalDitolak: null,
    ditandatanganiOlehPjPenyusunUserId: null,
    tanggalTTDBaPjPenyusun: null,
    tanggalDiselesaikan: null,
    version: 0,
    createdAt: now,
    updatedAt: now,
    opd: { opdId: 'opd-a', nama: 'OPD A' },
    nilaiEvaluasi: [],
    diselesaikanOleh: null,
    ditolakOleh: null,
    diverifikasiOlehUser: null,
    ditandatanganiOlehPjPenyusunUser: null,
    dokumenTte: [],
    logNilaiEvaluasi: [],
    ...overrides,
  } as PengajuanEvaluasiDetailRow;
}

describe('PengajuanEvaluasiService', () => {
  const userPjPenyusun: JwtAccessPayload = {
    sub: 'pj-penyusun-1',
    email: 'pj@test',
    peran: PeranPengguna.PJ_PENYUSUN,
  };
  const userEvaluator: JwtAccessPayload = {
    sub: 'evaluator-1',
    email: 'evaluator@test',
    peran: PeranPengguna.EVALUATOR,
  };

  describe('read', () => {
    it('membatasi daftar role OPD-scoped ke OPD pengguna', async () => {
      const getRequiredUserOpdId = jest.fn().mockResolvedValue('opd-a');
      const buildWhereFromQuery = jest.fn().mockReturnValue({ AND: [{ opdId: 'opd-a' }] });
      const findManyFiltered = jest.fn().mockResolvedValue([]);
      const repository = {
        buildWhereFromQuery,
        findManyFiltered,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository, { getRequiredUserOpdId });

      const actual = await service.findAll(
        { sub: 'pen-1', email: 'pen@test', peran: PeranPengguna.PENYUSUN },
        {},
      );

      expect(getRequiredUserOpdId).toHaveBeenCalledWith('pen-1', 'OPD pengguna tidak ditemukan');
      expect(buildWhereFromQuery).toHaveBeenCalledWith(expect.any(Object), 'opd-a');
      expect(actual).toEqual([]);
    });

    it('menghilangkan informasi OPD dari payload PJ Penyusun', async () => {
      const repository = {
        buildWhereFromQuery: jest.fn().mockReturnValue({ AND: [{ opdId: 'opd-a' }] }),
        findManyFiltered: jest.fn().mockResolvedValue([buildPengajuanRow()]),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      const actual = await service.findAll(userPjPenyusun, {});

      expect(actual[0]).not.toHaveProperty('opdId');
      expect(actual[0]).not.toHaveProperty('opdNama');
      expect(actual[0]).not.toHaveProperty('opd');
      expect(actual[0]).not.toHaveProperty('nilaiOPD');
    });

    it('menyertakan informasi OPD untuk evaluator', async () => {
      const repository = {
        buildWhereFromQuery: jest.fn().mockReturnValue({}),
        findManyFiltered: jest.fn().mockResolvedValue([buildPengajuanRow({ nilaiOPD: 4 })]),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      const actual = await service.findAll(userEvaluator, {});

      expect(actual[0]).toMatchObject({
        opdId: 'opd-a',
        opdNama: 'OPD A',
        nilaiOPD: 4,
        opd: { id: 'opd-a', nama: 'OPD A' },
      });
    });

    it('mengembalikan ringkasan terpaginasi', async () => {
      const findRingkasPage = jest.fn().mockResolvedValue([
        {
          pengajuanEvaluasiId: 'p1',
          opdId: 'opd-a',
          opdNama: 'OPD A',
          jenis: 'EVALUASI_REQUEST_EVALUATOR',
          status: 'SELESAI_DIEVALUASI',
          statusLabel: 'Selesai Dievaluasi',
          createdAt: '2026-01-01T00:00:00.000Z',
          jumlahSop: 2,
          jumlahSudahDinilai: 2,
        },
      ]);
      const repository = {
        buildWhereRingkasFromQuery: jest.fn().mockReturnValue({}),
        countWhere: jest.fn().mockResolvedValue(25),
        findRingkasPage,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      const actual = await service.findAllRingkas(
        { sub: 'pj', email: 'pj@test', peran: PeranPengguna.PJ_EVALUATOR },
        { page: 2, limit: 10 },
      );

      expect(findRingkasPage).toHaveBeenCalledWith({}, 10, 10);
      expect(actual.pagination).toEqual({
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      });
    });

    it('findOne melempar NotFoundException jika data tidak ada', async () => {
      const repository = {
        findByIdFull: jest.fn().mockResolvedValue(null),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(service.findOne(userPjPenyusun, 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('findOne memeriksa kesamaan OPD untuk role OPD-scoped', async () => {
      const assertSameOpd = jest.fn().mockResolvedValue(undefined);
      const repository = {
        findByIdFull: jest.fn().mockResolvedValue(buildPengajuanRow()),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository, { assertSameOpd });

      const actual = await service.findOne(
        { sub: 'pen-1', email: 'pen@test', peran: PeranPengguna.PENYUSUN },
        'peng-1',
      );

      expect(assertSameOpd).toHaveBeenCalledWith(
        'pen-1',
        'opd-a',
        'Anda tidak dapat mengakses pengajuan evaluasi OPD lain',
      );
      expect(actual.id).toBe('peng-1');
    });
  });

  describe('create', () => {
    it('menolak role selain PJ Penyusun sebelum repository dipanggil', async () => {
      const createPengajuanDenganLock = jest.fn();
      const repository = { createPengajuanDenganLock } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userEvaluator, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(createPengajuanDenganLock).not.toHaveBeenCalled();
    });

    it('menolak PJ Penyusun yang tidak terikat OPD', async () => {
      const getRequiredUserOpdId = jest
        .fn()
        .mockRejectedValue(new ForbiddenException('OPD pengguna tidak ditemukan'));
      const createPengajuanDenganLock = jest.fn();
      const repository = { createPengajuanDenganLock } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository, { getRequiredUserOpdId });

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(createPengajuanDenganLock).not.toHaveBeenCalled();
    });

    it('menolak detail SOP duplikat sebelum repository dipanggil', async () => {
      const createPengajuanDenganLock = jest.fn();
      const repository = { createPengajuanDenganLock } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1', 'detail-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(createPengajuanDenganLock).not.toHaveBeenCalled();
    });

    it.each([
      JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
      JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
    ])('mendelegasikan jenis %s ke repository atomik', async (jenis) => {
      const createPengajuanDenganLock = jest.fn().mockResolvedValue({
        ok: true,
        pengajuanEvaluasiId: 'peng-1',
      });
      const findByIdFull = jest.fn().mockResolvedValue(buildPengajuanRow({ jenis }));
      const repository = {
        createPengajuanDenganLock,
        findByIdFull,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      const actual = await service.create(userPjPenyusun, {
        jenis,
        sopDetailIds: ['detail-1'],
      });

      expect(createPengajuanDenganLock).toHaveBeenCalledWith({
        opdId: 'opd-a',
        jenis,
        sopDetailIds: ['detail-1'],
        activeStatuses: STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK,
        eligibleDetailStatuses: [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI],
      });
      expect(findByIdFull).toHaveBeenCalledWith('peng-1');
      expect(actual).toMatchObject({ id: 'peng-1', jenis: String(jenis) });
      expect(actual).not.toHaveProperty('opdId');
    });

    it('memetakan ACTIVE_EXISTS menjadi ConflictException', async () => {
      const repository = {
        createPengajuanDenganLock: jest.fn().mockResolvedValue({
          ok: false,
          error: 'ACTIVE_EXISTS',
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('memetakan DETAIL_NOT_FOUND dengan konteks OPD pengguna', async () => {
      const repository = {
        createPengajuanDenganLock: jest.fn().mockResolvedValue({
          ok: false,
          error: 'DETAIL_NOT_FOUND',
          detailSopId: 'detail-1',
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toThrow('Detail SOP detail-1 tidak ditemukan atau bukan milik OPD Anda.');
    });

    it('memetakan DETAIL_BAD_STATUS menjadi BadRequestException', async () => {
      const repository = {
        createPengajuanDenganLock: jest.fn().mockResolvedValue({
          ok: false,
          error: 'DETAIL_BAD_STATUS',
          detailSopId: 'detail-1',
          status: StatusSOP.DRAFT,
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('memetakan STATUS_DRIFT menjadi ConflictException', async () => {
      const repository = {
        createPengajuanDenganLock: jest.fn().mockResolvedValue({
          ok: false,
          error: 'STATUS_DRIFT',
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toThrow('Muat ulang daftar SOP lalu coba lagi.');
    });

    it('melempar ConflictException jika hasil create tidak dapat dimuat ulang', async () => {
      const repository = {
        createPengajuanDenganLock: jest.fn().mockResolvedValue({
          ok: true,
          pengajuanEvaluasiId: 'peng-1',
        }),
        findByIdFull: jest.fn().mockResolvedValue(null),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.create(userPjPenyusun, {
          jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_EVALUATOR,
          sopDetailIds: ['detail-1'],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('pastikanPengajuanRequestOpdUntukEvaluator', () => {
    it('no-op untuk role selain evaluator', async () => {
      const ensurePengajuanRequestOpdDenganLock = jest.fn();
      const repository = {
        ensurePengajuanRequestOpdDenganLock,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await service.pastikanPengajuanRequestOpdUntukEvaluator(
        { sub: 'pj', email: 'pj@test', peran: PeranPengguna.PJ_EVALUATOR },
        'opd-a',
        [{ detailSopId: 'detail-1', statusDetail: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI }],
      );

      expect(ensurePengajuanRequestOpdDenganLock).not.toHaveBeenCalled();
    });

    it('no-op jika pipeline tidak memiliki detail siap evaluasi', async () => {
      const ensurePengajuanRequestOpdDenganLock = jest.fn();
      const repository = {
        ensurePengajuanRequestOpdDenganLock,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await service.pastikanPengajuanRequestOpdUntukEvaluator(userEvaluator, 'opd-a', [
        { detailSopId: 'detail-1', statusDetail: StatusSOP.DRAFT },
      ]);

      expect(ensurePengajuanRequestOpdDenganLock).not.toHaveBeenCalled();
    });

    it('mendelegasikan bootstrap evaluator ke repository atomik', async () => {
      const ensurePengajuanRequestOpdDenganLock = jest.fn().mockResolvedValue({
        ok: true,
        created: true,
        pengajuanEvaluasiId: 'peng-1',
      });
      const repository = {
        ensurePengajuanRequestOpdDenganLock,
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await service.pastikanPengajuanRequestOpdUntukEvaluator(userEvaluator, 'opd-a', [
        {
          detailSopId: 'detail-1',
          statusDetail: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
        },
      ]);

      expect(ensurePengajuanRequestOpdDenganLock).toHaveBeenCalledWith({
        opdId: 'opd-a',
        jenis: JenisPengajuanEvaluasi.EVALUASI_REQUEST_OPD,
        sopDetailIds: ['detail-1'],
        activeStatuses: STATUS_PENGAJUAN_AKTIF_LINTAS_JOBDESK,
        eligibleDetailStatuses: [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI],
      });
    });

    it('membiarkan active existing sebagai no-op sukses repository', async () => {
      const repository = {
        ensurePengajuanRequestOpdDenganLock: jest.fn().mockResolvedValue({
          ok: true,
          created: false,
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.pastikanPengajuanRequestOpdUntukEvaluator(userEvaluator, 'opd-a', [
          {
            detailSopId: 'detail-1',
            statusDetail: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
          },
        ]),
      ).resolves.toBeUndefined();
    });

    it('memetakan STATUS_DRIFT dengan pesan reload halaman', async () => {
      const repository = {
        ensurePengajuanRequestOpdDenganLock: jest.fn().mockResolvedValue({
          ok: false,
          error: 'STATUS_DRIFT',
        }),
      } as unknown as PengajuanEvaluasiRepository;
      const service = buildService(repository);

      await expect(
        service.pastikanPengajuanRequestOpdUntukEvaluator(userEvaluator, 'opd-a', [
          {
            detailSopId: 'detail-1',
            statusDetail: StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI,
          },
        ]),
      ).rejects.toThrow('Muat ulang halaman lalu coba lagi.');
    });
  });

  describe('otorisasi helper', () => {
    it('resolveOpdIdTerikat mengembalikan OPD untuk PJ Penyusun', async () => {
      const service = buildService({} as PengajuanEvaluasiRepository);

      await expect(service.resolveOpdIdTerikat(userPjPenyusun)).resolves.toBe('opd-a');
    });

    it('resolveOpdIdTerikat menolak evaluator global', async () => {
      const service = buildService({} as PengajuanEvaluasiRepository);

      await expect(service.resolveOpdIdTerikat(userEvaluator)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('assertUserCanAccessPengajuan tidak mengecek OPD untuk evaluator', async () => {
      const assertSameOpd = jest.fn();
      const service = buildService({} as PengajuanEvaluasiRepository, { assertSameOpd });

      await expect(
        service.assertUserCanAccessPengajuan(userEvaluator, 'opd-a'),
      ).resolves.toBeUndefined();
      expect(assertSameOpd).not.toHaveBeenCalled();
    });

    it('assertUserCanAccessPengajuan menolak role yang tidak dikenal', async () => {
      const service = buildService({} as PengajuanEvaluasiRepository);

      await expect(
        service.assertUserCanAccessPengajuan(
          { sub: 'admin', email: 'admin@test', peran: 'ADMIN' as PeranPengguna },
          'opd-a',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
