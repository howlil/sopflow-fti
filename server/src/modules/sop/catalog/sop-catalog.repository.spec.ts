import { BagianSOP, StatusSOP } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { SopCatalogRepository } from './sop-catalog.repository';

describe('SopCatalogRepository', () => {
  it('logs a native status update without legacy evaluation persistence', async () => {
    const calls: Array<{ table: string; op: string; args: unknown }> = [];
    const record = (table: string, op: string) =>
      jest.fn(async (args: unknown) => {
        calls.push({ table, op, args });
        if (table === 'logEditSOP' && op === 'findFirst') return null;
        return { count: 1 };
      });
    const tx = {
      detailSOP: { update: record('detailSOP', 'update') },
      logEditSOP: {
        findFirst: record('logEditSOP', 'findFirst'),
        create: record('logEditSOP', 'create'),
        update: record('logEditSOP', 'update'),
        updateMany: record('logEditSOP', 'updateMany'),
      },
      logEditSopDomainField: {
        deleteMany: record('logEditSopDomainField', 'deleteMany'),
        createMany: record('logEditSopDomainField', 'createMany'),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (inner: unknown) => Promise<void>) => callback(tx)),
    } as unknown as PrismaService;

    await new SopCatalogRepository(prisma).updateDetailSopStatus({
      detailSopId: 'detail-1',
      status: StatusSOP.DRAFT,
      userId: 'user-1',
    });

    expect(calls.some((call) => call.table === 'detailSOP' && call.op === 'update')).toBe(true);
    const log = calls.find((call) => call.table === 'logEditSOP' && call.op === 'create');
    expect(log).toBeDefined();
    expect((log!.args as { data: { bagian: BagianSOP } }).data.bagian).toBe(BagianSOP.STATUS);
    expect(calls.some((call) => call.table === 'nilaiEvaluasi')).toBe(false);
    expect(calls.some((call) => call.table === 'logNilaiEvaluasi')).toBe(false);
  });
});
