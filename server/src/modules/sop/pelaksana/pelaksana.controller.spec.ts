import type { Request } from 'express';
import type { JwtAccessPayload } from '../../core/auth/helpers/auth.shared';
import type { ProsesBisnisContextService } from '../../core/proses-bisnis/konteks-proses-bisnis.service';
import { PelaksanaController } from './pelaksana.controller';
import { PelaksanaService } from './pelaksana.service';

describe('PelaksanaController global catalog', () => {
  let controller: PelaksanaController;
  let service: jest.Mocked<Pick<PelaksanaService, 'list' | 'create' | 'update' | 'remove'>>;
  let processContext: jest.Mocked<
    Pick<ProsesBisnisContextService, 'assertCanManageGlobalCatalog'>
  >;

  const user: JwtAccessPayload = {
    sub: 'user-1',
    email: 'member@example.test',
    sesiTokenVersion: 1,
  };
  const req = { user } as unknown as Request & { user: JwtAccessPayload };
  const responseRow = {
    id: 'pl-1',
    namaPelaksana: 'Dosen',
    createdBy: { id: 'user-1', nama: 'User FTI' },
    updatedBy: { id: 'user-1', nama: 'User FTI' },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    processContext = {
      assertCanManageGlobalCatalog: jest.fn().mockResolvedValue({
        prosesBisnisId: 'process-1',
      }),
    };
    controller = new PelaksanaController(
      service as unknown as PelaksanaService,
      processContext as unknown as ProsesBisnisContextService,
    );
  });

  it('returns the global list without organization-scoping input', async () => {
    service.list.mockResolvedValueOnce([responseRow]);
    const actual = await controller.list();
    expect(service.list).toHaveBeenCalledWith();
    expect(processContext.assertCanManageGlobalCatalog).not.toHaveBeenCalled();
    expect(actual.data).toEqual([responseRow]);
  });

  it('requires catalog capability and passes authenticated user attribution to create', async () => {
    const dto = { namaPelaksana: 'Dosen' };
    service.create.mockResolvedValueOnce(responseRow);
    const actual = await controller.create(req, dto);
    expect(processContext.assertCanManageGlobalCatalog).toHaveBeenCalledWith(user.sub);
    expect(service.create).toHaveBeenCalledWith(user, dto);
    expect(actual.data).toBe(responseRow);
  });

  it('requires catalog capability and passes authenticated user attribution to update', async () => {
    const dto = { namaPelaksana: 'Dosen Pengampu' };
    service.update.mockResolvedValueOnce({ ...responseRow, namaPelaksana: 'Dosen Pengampu' });
    const actual = await controller.update(req, 'pl-1', dto);
    expect(processContext.assertCanManageGlobalCatalog).toHaveBeenCalledWith(user.sub);
    expect(service.update).toHaveBeenCalledWith(user, 'pl-1', dto);
    expect(actual.data).toEqual(expect.objectContaining({ namaPelaksana: 'Dosen Pengampu' }));
  });

  it('requires catalog capability and passes the authenticated user when deleting an unused global actor', async () => {
    service.remove.mockResolvedValueOnce(undefined);
    const actual = await controller.remove(req, 'pl-1');
    expect(processContext.assertCanManageGlobalCatalog).toHaveBeenCalledWith(user.sub);
    expect(service.remove).toHaveBeenCalledWith(user, 'pl-1');
    expect(actual).toEqual({ message: 'Pelaksana berhasil dihapus', success: true, data: null });
  });
});
