import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { JwtAccessPayload } from '../../../common';
import { JenisLangkahProsedur, StatusSOP } from '../../../generated/prisma';
import { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';
import { SopProsedurRepository } from './sop-prosedur.repository';
import { SopProsedurService } from './sop-prosedur.service';

describe('SopProsedurService Proses Bisnis-native actor policy', () => {
  const repo = {
    findDetailIdByDetailOrSopId: jest.fn(),
    findDetailStatus: jest.fn(),
    findGlobalPelaksana: jest.fn(),
    findExistingSwimlanePelaksanaIds: jest.fn(),
    findExistingLangkahPelaksanaIds: jest.fn(),
    updateProsedurTransaction: jest.fn(),
  };
  const catalog = {
    getPenyusunWorkbench: jest.fn(),
    getForDetail: jest.fn(),
  };
  const processContext = { assertCanAuthor: jest.fn() };

  const anggotaProsesBisnis: JwtAccessPayload = {
    sub: 'anggota-1',
    email: 'anggota@fti.test',
  };
  const workbench = {
    detail: { id: 'detail-1' },
    langkah: [],
  } as unknown as PenyusunWorkbenchDataDto;

  let service: SopProsedurService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SopProsedurService(
      repo as unknown as SopProsedurRepository,
      catalog as unknown as SopWorkbenchReader,
      processContext as unknown as ProsesBisnisContextService,
    );
    repo.findDetailIdByDetailOrSopId.mockResolvedValue({
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: 'process-1',
    });
    repo.findDetailStatus.mockResolvedValue(StatusSOP.DRAFT);
    repo.findGlobalPelaksana.mockResolvedValue(new Map([['actor-1', 'Dosen']]));
    repo.findExistingSwimlanePelaksanaIds.mockResolvedValue(['actor-1']);
    repo.findExistingLangkahPelaksanaIds.mockResolvedValue([]);
    repo.updateProsedurTransaction.mockResolvedValue(undefined);
    processContext.assertCanAuthor.mockResolvedValue({ prosesBisnisId: 'process-1' });
    catalog.getForDetail.mockResolvedValue(workbench);
  });

  it('rejects an unknown SOP before authorization work', async () => {
    repo.findDetailIdByDetailOrSopId.mockResolvedValue(null);
    await expect(service.updateProsedur(anggotaProsesBisnis, 'missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows a Proses Bisnis anggota based on Proses Bisnis relationship, independent from OPD shadow', async () => {
    await service.updateProsedur(anggotaProsesBisnis, 'detail-1', {
      pelaksana: [{ pelaksanaId: 'actor-1' }],
    });

    expect(processContext.assertCanAuthor).toHaveBeenCalledWith('anggota-1', 'process-1');
    expect(repo.updateProsedurTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        detailSopId: 'detail-1',
        input: { pelaksana: [{ pelaksanaId: 'actor-1', namaSnapshot: 'Dosen' }] },
      }),
    );
  });

  it('propagates Proses Bisnis authorization denial for unrelated users', async () => {
    processContext.assertCanAuthor.mockRejectedValue(
      new ForbiddenException('not a Proses Bisnis anggota'),
    );
    await expect(service.updateProsedur(anggotaProsesBisnis, 'detail-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects an unbound SOP instead of using OPD compatibility authorization', async () => {
    repo.findDetailIdByDetailOrSopId.mockResolvedValue({
      detailSopId: 'detail-1',
      sopId: 'sop-1',
      prosesBisnisId: null,
    });
    await expect(service.updateProsedur(anggotaProsesBisnis, 'detail-1', {})).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(processContext.assertCanAuthor).not.toHaveBeenCalled();
    expect(repo.updateProsedurTransaction).not.toHaveBeenCalled();
  });

  it('rejects an actor id that does not exist in the global catalog', async () => {
    repo.findGlobalPelaksana.mockResolvedValue(new Map());
    await expect(
      service.updateProsedur(anggotaProsesBisnis, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'missing-actor' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow removing a swimlane actor while existing steps still use it', async () => {
    repo.findGlobalPelaksana.mockResolvedValue(new Map([['actor-2', 'Mahasiswa']]));
    repo.findExistingLangkahPelaksanaIds.mockResolvedValue(['actor-1']);
    await expect(
      service.updateProsedur(anggotaProsesBisnis, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'actor-2' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires every step actor to be selected in the same SOP swimlane', async () => {
    await expect(
      service.updateProsedur(anggotaProsesBisnis, 'detail-1', {
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

  it('preserves editability rules for Proses Bisnis-bound SOPs', async () => {
    repo.findDetailStatus.mockResolvedValue(StatusSOP.EFFECTIVE);
    await expect(
      service.updateProsedur(anggotaProsesBisnis, 'detail-1', {
        pelaksana: [{ pelaksanaId: 'actor-1' }],
      }),
    ).rejects.toThrow();
    expect(repo.updateProsedurTransaction).not.toHaveBeenCalled();
  });
});
