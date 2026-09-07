import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JenisDiagram, StatusSOP } from '../../../generated/prisma';
import { SopDiagramService } from './sop-diagram.service';

describe('SopDiagramService Process authorization', () => {
  const user = {
    sub: 'user-1',
    email: 'member@fti.example.test',
  } as never;

  function createService(overrides?: {
    resolved?: { detailSopId: string; processId: string | null } | null;
    status?: string | null;
  }) {
    const defaultResolved = { detailSopId: 'det-1', processId: 'process-1' };
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
    const processContextService = {
      assertCanAuthor: jest.fn().mockResolvedValue({ processId: 'process-1' }),
    };
    const service = new SopDiagramService(
      sopDiagramRepository as never,
      sopWorkbenchReader as never,
      processContextService as never,
    );
    return {
      service,
      sopDiagramRepository,
      sopWorkbenchReader,
      processContextService,
    };
  }

  it('rejects a missing DetailSOP', async () => {
    const { service } = createService({ resolved: null });
    await expect(
      service.updateDiagram(user, 'missing', { jenis: JenisDiagram.FLOWCHART, layoutSeed: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('authorizes a Process member and returns the updated workbench', async () => {
    const { service, processContextService, sopDiagramRepository, sopWorkbenchReader } =
      createService();

    const actual = await service.updateDiagram(
      { sub: 'member-1', email: 'member@fti.example.test' } as never,
      'det-1',
      {
        jenis: JenisDiagram.FLOWCHART,
        layoutSeed: 2,
        pathOverrides: { edges: {} },
      },
    );

    expect(processContextService.assertCanAuthor).toHaveBeenCalledWith('member-1', 'process-1');
    expect(sopDiagramRepository.upsertConfig).toHaveBeenCalled();
    expect(sopWorkbenchReader.getForDetail).toHaveBeenCalledWith('det-1', undefined);
    expect(actual.detail.id).toBe('det-1');
  });

  it('rejects an SOP without Process ownership', async () => {
    const { service, processContextService } = createService({
      resolved: { detailSopId: 'det-1', processId: null },
    });

    await expect(
      service.updateDiagram(user, 'det-1', { jenis: JenisDiagram.FLOWCHART }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(processContextService.assertCanAuthor).not.toHaveBeenCalled();
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
