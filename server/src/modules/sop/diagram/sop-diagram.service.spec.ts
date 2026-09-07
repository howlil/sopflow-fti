import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JenisDiagram, StatusSOP } from '../../../generated/prisma';
import { SopDiagramService } from './sop-diagram.service';

describe('SopDiagramService Proses Bisnis authorization', () => {
  const user = {
    sub: 'user-1',
    email: 'anggota@fti.example.test',
  } as never;

  function createService(overrides?: {
    resolved?: { detailSopId: string; prosesBisnisId: string | null } | null;
    status?: string | null;
  }) {
    const defaultResolved = { detailSopId: 'det-1', prosesBisnisId: 'process-1' };
    const resolved =
      overrides !== undefined && 'resolved' in overrides ? overrides.resolved : defaultResolved;
    const sopDiagramRepository = {
      findDetailIdByDetailOrSopId: jest.fn().mockResolvedValue(resolved),
      findDetailStatus: jest
        .fn()
        .mockResolvedValue(
          overrides !== undefined && 'status' in overrides ? overrides.status : StatusSOP.DRAFT,
        ),
      upsertConfig: jest.fn().mockResolvedValue({}),
    };
    const sopWorkbenchReader = {
      getForDetail: jest
        .fn()
        .mockResolvedValue({ detail: { id: 'det-1' }, langkah: [], logEdit: [] }),
    };
    const konteksProsesBisnisService = {
      assertCanAuthor: jest.fn().mockResolvedValue({ prosesBisnisId: 'process-1' }),
    };
    const service = new SopDiagramService(
      sopDiagramRepository as never,
      sopWorkbenchReader as never,
      konteksProsesBisnisService as never,
    );
    return {
      service,
      sopDiagramRepository,
      sopWorkbenchReader,
      konteksProsesBisnisService,
    };
  }

  it('rejects a missing DetailSOP', async () => {
    const { service } = createService({ resolved: null });
    await expect(
      service.updateDiagram(user, 'missing', { jenis: JenisDiagram.FLOWCHART, layoutSeed: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('authorizes a Proses Bisnis anggota and returns the updated workbench', async () => {
    const { service, konteksProsesBisnisService, sopDiagramRepository, sopWorkbenchReader } =
      createService();

    const actual = await service.updateDiagram(
      { sub: 'anggota-1', email: 'anggota@fti.example.test' } as never,
      'det-1',
      {
        jenis: JenisDiagram.FLOWCHART,
        layoutSeed: 2,
        pathOverrides: { edges: {} },
      },
    );

    expect(konteksProsesBisnisService.assertCanAuthor).toHaveBeenCalledWith('anggota-1', 'process-1');
    expect(sopDiagramRepository.upsertConfig).toHaveBeenCalled();
    expect(sopWorkbenchReader.getForDetail).toHaveBeenCalledWith('det-1', undefined);
    expect(actual.detail.id).toBe('det-1');
  });

  it('rejects an SOP without Penanggung Jawab kepemilikan Proses Bisnis', async () => {
    const { service, konteksProsesBisnisService } = createService({
      resolved: { detailSopId: 'det-1', prosesBisnisId: null },
    });

    await expect(
      service.updateDiagram(user, 'det-1', { jenis: JenisDiagram.FLOWCHART }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(konteksProsesBisnisService.assertCanAuthor).not.toHaveBeenCalled();
  });

  it('rejects a missing detail status', async () => {
    const { service } = createService({ status: null });
    await expect(
      service.updateDiagram(user, 'det-1', { jenis: JenisDiagram.FLOWCHART }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects editing an effective SOP version', async () => {
    const { service } = createService({ status: StatusSOP.EFFECTIVE });
    await expect(
      service.updateDiagram(user, 'det-1', { jenis: JenisDiagram.FLOWCHART }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects malformed path overrides', async () => {
    const { service } = createService();
    await expect(
      service.updateDiagram(user, 'det-1', {
        jenis: JenisDiagram.BPMN,
        pathOverrides: { edges: { bad: { sSide: 'invalid' } as never } },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an array in place of path overrides', async () => {
    const { service } = createService();
    await expect(
      service.updateDiagram(user, 'det-1', {
        jenis: JenisDiagram.FLOWCHART,
        pathOverrides: [] as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects malformed edge keys', async () => {
    const { service } = createService();
    const badOverrides = {
      edges: {
        'nodeA|nodeB': {
          sSide: 'top',
          eSide: 'bottom',
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 0, y: 0 },
          bendPoints: [],
        },
      },
    };

    await expect(
      service.updateDiagram(user, 'det-1', {
        jenis: JenisDiagram.FLOWCHART,
        pathOverrides: badOverrides as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the workbench without writing when no diagram state changes', async () => {
    const { service, sopDiagramRepository, sopWorkbenchReader } = createService();
    const actual = await service.updateDiagram(user, 'det-1', { jenis: JenisDiagram.FLOWCHART });

    expect(sopDiagramRepository.upsertConfig).not.toHaveBeenCalled();
    expect(sopWorkbenchReader.getForDetail).toHaveBeenCalledWith('det-1', undefined);
    expect(actual.detail.id).toBe('det-1');
  });
});
