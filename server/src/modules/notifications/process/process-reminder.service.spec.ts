import { Prisma, ProcessNotificationKind, ProcessReminderKind } from '../../../generated/prisma';
import { ProcessReminderService } from './process-reminder.service';

type TransactionMock = {
  processReminder: {
    deleteMany: jest.MockedFunction<
      (args: { where: { detailSopId: string } }) => Promise<{ count: number }>
    >;
    create: jest.MockedFunction<(args: { data: ReminderCreateData }) => Promise<void>>;
  };
  pengguna: {
    findUnique: jest.Mock;
  };
};

type ReminderCreateData = {
  detailSopId: string;
  processId: string;
  penggunaId: string;
  kind: ProcessReminderKind;
  destinationPhone: string;
  nextSendAt: Date;
};

function createService() {
  const prisma = { processReminder: { findMany: jest.fn() } } as unknown as ConstructorParameters<
    typeof ProcessReminderService
  >[0];
  return new ProcessReminderService(prisma);
}

function createTransaction(
  recipient: { nohp: string } | null = { nohp: '081234567890' },
): TransactionMock {
  const deleteMany = jest
    .fn()
    .mockResolvedValue({ count: 1 }) as unknown as TransactionMock['processReminder']['deleteMany'];
  const create = jest
    .fn()
    .mockResolvedValue(undefined) as unknown as TransactionMock['processReminder']['create'];
  return {
    processReminder: {
      deleteMany,
      create,
    },
    pengguna: { findUnique: jest.fn().mockResolvedValue(recipient) },
  };
}

const input = {
  detailSopId: 'detail-1',
  sopId: 'sop-1',
  processId: 'process-1',
  penggunaId: 'owner-1',
  kind: ProcessNotificationKind.PROCESS_OWNER_REVIEW_REQUESTED,
  processName: 'Process Akademik',
} as const;

describe('ProcessReminderService', () => {
  it('mengganti state reminder aktif sesuai actor native dan menyimpan nomor tujuannya', async () => {
    const service = createService();
    const tx = createTransaction();

    await service.syncForNotificationInTransaction(
      tx as unknown as Prisma.TransactionClient,
      input,
    );

    expect(tx.processReminder.deleteMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-1' },
    });
    const createCall = tx.processReminder.create.mock.calls[0]?.[0] as
      | { data: ReminderCreateData }
      | undefined;
    expect(createCall?.data).toEqual(
      expect.objectContaining({
        detailSopId: 'detail-1',
        processId: 'process-1',
        penggunaId: 'owner-1',
        kind: ProcessReminderKind.PROCESS_OWNER_REVIEW,
        destinationPhone: '081234567890',
      }),
    );
    expect(createCall?.data.nextSendAt).toBeInstanceOf(Date);
  });

  it('membersihkan reminder lama tanpa membuat state jika recipient sudah tidak tersedia', async () => {
    const service = createService();
    const tx = createTransaction(null);

    await service.syncForNotificationInTransaction(tx as unknown as Prisma.TransactionClient, {
      ...input,
      kind: ProcessNotificationKind.PROCESS_SOP_EFFECTIVE,
    });

    expect(tx.processReminder.deleteMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-1' },
    });
    expect(tx.processReminder.create).not.toHaveBeenCalled();
  });

  it('memetakan revisi dan approval ke kind reminder native yang terpisah', async () => {
    const service = createService();

    for (const [notificationKind, reminderKind] of [
      [ProcessNotificationKind.PROCESS_REVISION_REQUESTED, ProcessReminderKind.PROCESS_REVISION],
      [ProcessNotificationKind.FINAL_APPROVAL_REQUESTED, ProcessReminderKind.FINAL_APPROVAL],
    ] as const) {
      const tx = createTransaction();
      await service.syncForNotificationInTransaction(tx as unknown as Prisma.TransactionClient, {
        ...input,
        kind: notificationKind,
      });
      const createCall = tx.processReminder.create.mock.calls[0]?.[0] as
        | { data: ReminderCreateData }
        | undefined;
      expect(createCall?.data.kind).toBe(reminderKind);
    }
  });
});
