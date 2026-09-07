import { Prisma, JenisNotifikasiProsesBisnis, JenisPengingatProsesBisnis } from '../../../generated/prisma';
import { PengingatProsesBisnisService } from './process-reminder.service';

type TransactionMock = {
  pengingatProsesBisnis: {
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
  prosesBisnisId: string;
  penggunaId: string;
  kind: JenisPengingatProsesBisnis;
  destinationPhone: string;
  nextSendAt: Date;
};

function createService() {
  const prisma = { pengingatProsesBisnis: { findMany: jest.fn() } } as unknown as ConstructorParameters<
    typeof PengingatProsesBisnisService
  >[0];
  return new PengingatProsesBisnisService(prisma);
}

function createTransaction(
  recipient: { nohp: string } | null = { nohp: '081234567890' },
): TransactionMock {
  const deleteMany = jest
    .fn()
    .mockResolvedValue({ count: 1 }) as unknown as TransactionMock['pengingatProsesBisnis']['deleteMany'];
  const create = jest
    .fn()
    .mockResolvedValue(undefined) as unknown as TransactionMock['pengingatProsesBisnis']['create'];
  return {
    pengingatProsesBisnis: {
      deleteMany,
      create,
    },
    pengguna: { findUnique: jest.fn().mockResolvedValue(recipient) },
  };
}

const input = {
  detailSopId: 'detail-1',
  sopId: 'sop-1',
  prosesBisnisId: 'process-1',
  penggunaId: 'owner-1',
  kind: JenisNotifikasiProsesBisnis.PROCESS_OWNER_REVIEW_REQUESTED,
  namaProsesBisnis: 'Proses Bisnis Akademik',
} as const;

describe('PengingatProsesBisnisService', () => {
  it('mengganti state reminder aktif sesuai actor native dan menyimpan nomor tujuannya', async () => {
    const service = createService();
    const tx = createTransaction();

    await service.syncForNotificationInTransaction(
      tx as unknown as Prisma.TransactionClient,
      input,
    );

    expect(tx.pengingatProsesBisnis.deleteMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-1' },
    });
    const createCall = tx.pengingatProsesBisnis.create.mock.calls[0]?.[0] as
      | { data: ReminderCreateData }
      | undefined;
    expect(createCall?.data).toEqual(
      expect.objectContaining({
        detailSopId: 'detail-1',
        prosesBisnisId: 'process-1',
        penggunaId: 'owner-1',
        kind: JenisPengingatProsesBisnis.PROCESS_OWNER_REVIEW,
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
      kind: JenisNotifikasiProsesBisnis.PROCESS_SOP_EFFECTIVE,
    });

    expect(tx.pengingatProsesBisnis.deleteMany).toHaveBeenCalledWith({
      where: { detailSopId: 'detail-1' },
    });
    expect(tx.pengingatProsesBisnis.create).not.toHaveBeenCalled();
  });

  it('memetakan revisi dan approval ke kind reminder native yang terpisah', async () => {
    const service = createService();

    for (const [notificationKind, reminderKind] of [
      [JenisNotifikasiProsesBisnis.PROCESS_REVISION_REQUESTED, JenisPengingatProsesBisnis.PROCESS_REVISION],
      [JenisNotifikasiProsesBisnis.FINAL_APPROVAL_REQUESTED, JenisPengingatProsesBisnis.FINAL_APPROVAL],
    ] as const) {
      const tx = createTransaction();
      await service.syncForNotificationInTransaction(tx as unknown as Prisma.TransactionClient, {
        ...input,
        kind: notificationKind,
      });
      const createCall = tx.pengingatProsesBisnis.create.mock.calls[0]?.[0] as
        | { data: ReminderCreateData }
        | undefined;
      expect(createCall?.data.kind).toBe(reminderKind);
    }
  });
});
