import { ConflictException } from '@nestjs/common';
import { LingkupOrganisasi, StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import type { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import type { SopCatalogRepository, SopDaftarDbRow } from '../catalog/sop-catalog.repository';
import type { SopWorkbenchReader } from '../catalog/sop-workbench-reader.service';
import { ProsesBisnisSopAuthoringService } from './sop-proses-bisnis-authoring.service';

describe('ProsesBisnisSopAuthoringService', () => {
  it('lists only native SOPs for the user Proses Bisnis relationships', async () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    const accessibleTarget: SopDaftarDbRow = {
      sopId: 'sop-target-accessible',
      judul: 'SOP Proses Bisnis TA',
      detail: {
        detailSopId: 'detail-target',
        nomorSOP: 'FTI/TA/001',
        status: StatusSOP.DRAFT,
        versi: 1,
        updatedAt: now,
        pembuatNama: 'Owner TA',
        editorNama: null,
        peraturanId: null,
      },
      versiBerlaku: null,
      allStatuses: [StatusSOP.DRAFT],
    };

    const prisma = {
      sOP: {
        findMany: jest.fn().mockResolvedValue([
          { sopId: 'sop-target-inaccessible', prosesBisnisId: 'prosesBisnis-b' },
          { sopId: 'sop-target-accessible', prosesBisnisId: 'prosesBisnis-a' },
        ]),
      },
      persetujuanAkhirSOP: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      penugasanPejabatBerwenang: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      pengguna: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;
    const processContext = {
      listForUser: jest.fn().mockResolvedValue([
        {
          prosesBisnisId: 'prosesBisnis-a',
          nama: 'Tugas Akhir',
          lingkup: LingkupOrganisasi.FACULTY,
          penanggungJawabId: 'owner-1',
          departemenId: null,
          penanggungJawab: { nama: 'Penanggung Jawab Proses Bisnis' },
          departemen: null,
        },
      ]),
    } as unknown as ProsesBisnisContextService;
    const repository = {
      findDaftarAll: jest.fn().mockResolvedValue([accessibleTarget]),
    } as unknown as SopCatalogRepository;
    const workbenchReader = {} as unknown as SopWorkbenchReader;

    const service = new ProsesBisnisSopAuthoringService(
      prisma,
      processContext,
      repository,
      workbenchReader,
    );

    const rows = await service.listForCurrentUser(
      {
        sub: 'user-1',
        email: 'u@example.test',
        sesiTokenVersion: 1,
      },
      undefined,
    );

    expect(rows.map((row) => row.id)).toEqual(['sop-target-accessible']);
    expect(rows.map((row) => row.id)).not.toContain('sop-target-inaccessible');
    expect(rows.find((row) => row.id === 'sop-target-accessible')).toMatchObject({
      prosesBisnisId: 'prosesBisnis-a',
      namaProsesBisnis: 'Tugas Akhir',
      siklus: {
        stage: 'AUTHORING',
        stateLabel: 'Draft',
        responsibility: { type: 'CURRENT_USER', name: 'Anda' },
      },
    });
  });

  it('does not expose SOPs when the user has no Proses Bisnis relationship', async () => {
    const prisma = {
      sOP: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const processContext = {
      listForUser: jest.fn().mockResolvedValue([]),
    } as unknown as ProsesBisnisContextService;
    const repository = {
      findDaftarAll: jest.fn().mockResolvedValue([]),
    } as unknown as SopCatalogRepository;
    const workbenchReader = {} as unknown as SopWorkbenchReader;
    const service = new ProsesBisnisSopAuthoringService(
      prisma,
      processContext,
      repository,
      workbenchReader,
    );

    const rows = await service.listForCurrentUser(
      {
        sub: 'user-without-prosesBisnis',
        email: 'user@example.test',
        sesiTokenVersion: 1,
      },
      undefined,
    );

    expect(rows).toEqual([]);
  });

  it('rejects an unbound SOP on the native workbench endpoint', async () => {
    const prisma = {
      sOP: {
        findUnique: jest.fn().mockResolvedValue({ prosesBisnisId: null }),
      },
    } as unknown as PrismaService;
    const processContext = {} as unknown as ProsesBisnisContextService;
    const repository = {
      findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue({
        sopId: 'legacy-sop',
        detailSopId: 'legacy-detail',
      }),
    } as unknown as SopCatalogRepository;
    const workbenchReader = {
      getForDetail: jest.fn(),
    } as unknown as SopWorkbenchReader;
    const service = new ProsesBisnisSopAuthoringService(
      prisma,
      processContext,
      repository,
      workbenchReader,
    );

    await expect(
      service.getWorkbench(
        {
          sub: 'legacy-user',
          email: 'legacy@example.test',
          sesiTokenVersion: 1,
        },
        'legacy-detail',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((workbenchReader.getForDetail as jest.Mock).mock.calls).toHaveLength(0);
  });
});
