import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { JenisLangkahProsedur, PeranPengguna, StatusSOP } from '../../../generated/prisma';
import { UserOpdAccessService } from '../../core/opd/user-opd-access.service';
import { ProcessContextService } from '../../core/process/process-context.service';
import { SopCatalogService } from '../catalog/sop-catalog.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { SopProsedurRepository } from './sop-prosedur.repository';
import { SopProsedurService } from './sop-prosedur.service';

describe('SopProsedurService Process-native actor policy', () => {
  const repo = {
    findDetailIdByDetailOrSopId: jest.fn(),
    findProcessBindingBySopId: jest.fn(),
    findDetailStatus: jest.fn(),
    findGlobalPelaksana: jest.fn(),
    findExistingSwimlanePelaksanaIds: jest.fn(),
    findExistingLangkahPelaksanaIds: jest.fn(),
    updateProsedurTransaction: jest.fn(),
  };
  const catalog = {
    getPenyusunWorkbench: jest.fn(),
    getPenyusunWorkbenchForEvaluasiContext: jest.fn(),
  };
  const legacyOpd = { assertSameOpd: jest.fn() };
  const processContext = { assertCanAuthor: jest.fn() };

  const processMember: JwtAccessPayload = {
    sub: 'member-1',
    email: 'member@fti.test',
    peran: PeranPengguna.EVALUATOR,
  };
  const legacyPenyusun: JwtAccessPayload = {
    sub: 'penyusun-1',
    email: 'penyusun@fti.test',
    peran: PeranPengguna.PENYUSUN,
  };
  const workbench = { detail: { id: 'detail-1' }, langkah: [] } as unknown as PenyusunWorkbenchDataDto;

  let service: SopProsedurService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SopProsedurService(
      repo as unknown as SopProsedurRepository,
      catalog as unknown as SopCatalogService,
      legacyOpd as unknown as UserOpdAccessService,
      processContext as unknown as ProcessContextService,
    );
    repo.findDetailIdByDetailOrSopId.mockResolvedValue({
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      sopOpdId: 'legacy-opd-1',
    });
    repo.findProcessBindingBySopId.mockResolvedValue({ processId: 'process-1' });
    repo.findDetailStatus.mockResolvedValue(StatusSOP.DRAFT);
    repo.findGlobalPelaksana.mockResolvedValue(new Map([['actor-1', 'Dosen']]));
    repo.findExistingSwimlanePelaksanaIds.mockResolvedValue(['actor-1']);
    repo.findExistingLangkahPelaksanaIds.mockResolvedValue([]);
    repo.updateProsedurTransaction.mockResolvedValue(undefined);
    processContext.assertCanAuthor.mockResolvedValue({ processId: 'process-1' });
    legacyOpd.assertSameOpd.mockResolvedValue(undefined);
    catalog.getPenyusunWorkbench.mockResolvedValue(workbench);
    catalog.getPenyusunWorkbenchForEvaluasiContext.mockResolvedValue(workbench);
  });

  it('rejects an unknown SOP before authorization work', async () => {
    repo.findDetailIdByDetailOrSopId.mockResolvedValue(null);
    await expect(service.updateProsedur(processMember, 'missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows a Process member regardless of legacy global role or OPD', async () => {
    await service.updateProsedur(processMember, 'detail-1', {
      pelaksana: [{ pelaksanaId: 'actor-1' }],
    });

    expect(processContext.assertCanAuthor).toHaveBeenCalledWith('member-1', 'process-1');
    expect(legacyOpd.assertSameOpd).not.toHaveBeenCalled();
    expect(repo.updateProsedurTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        detailSopId: 'detail-1',
        input: { pelaksana: [{ pelaksanaId: 'actor-1', namaSnapshot: 'Dosen' }] },
      }),
    );
  });

  it('propagates Process authorization denial for unrelated users', async () => {
    processContext.assertCanAuthor.mockRejectedValue(new ForbiddenException('not a Process member'));
    await expect(service.updateProsedur(processMember, 'detail-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('keeps legacy unbound SOP on PENYUSUN + OPD compatibility authorization', async () => {
    repo.findProcessBindingBySopId.mockResolvedValue(null);
    await service.updateProsedur(legacyPenyusun, 'detail-1', {});
    expect(legacyOpd.assertSameOpd).toHaveBeenCalledWith(
      'penyusun-1',
      'legacy-opd-1',
      'Akses ditolak untuk DetailSOP ini',
    );
    expect(catalog.getPenyusunWorkbench).toHaveBeenCalled();
  });

  it('rejects non-legacy authors for an unbound legacy SOP', async () => {
    repo.findProcessBindingBySopId.mockResolvedValue(null);
    await expect(service.updateProsedur(processMember, 'detail-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects an actor id that does not exist in the global catalog', async () => {
    repo.findGlobalPelaksana.mockResolvedValue(new Map());
    await expect(
      service.updateProsedur(processMember, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'missing-actor' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow removing a swimlane actor while existing steps still use it', async () => {
    repo.findGlobalPelaksana.mockResolvedValue(new Map([['actor-2', 'Mahasiswa']]));
    repo.findExistingLangkahPelaksanaIds.mockResolvedValue(['actor-1']);
    await expect(
      service.updateProsedur(processMember, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'actor-2' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires every step actor to be selected in the same SOP swimlane', async () => {
    await expect(
      service.updateProsedur(processMember, 'detail-1', {
        langkah: [
          {
            tempId: 'step-1',
            jenis: JenisLangkahProsedur.KEGIATAN,
            kegiatan: 'Validasi berkas',
            pelaksanaId: 'actor-outside-swimlane',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('preserves editability rules for Process-bound SOPs', async () => {
    repo.findDetailStatus.mockResolvedValue(StatusSOP.BERLAKU);
    await expect(
      service.updateProsedur(processMember, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'actor-1' }],
      }),
    ).rejects.toThrow();
    expect(repo.updateProsedurTransaction).not.toHaveBeenCalled();
  });
});
