import { JenisLangkahProsedur, SatuanWaktu } from '../../../generated/prisma';
import type { PrismaService } from '../../../common/prisma/prisma.service';
import { SopProsedurRepository } from './sop-prosedur.repository';

interface CallLog {
  table: string;
  op: string;
  args: unknown;
}

function makeTx(existingLangkahIds: string[]): {
  tx: any;
  calls: CallLog[];
} {
  const calls: CallLog[] = [];
  const record = (table: string, op: string) =>
    jest.fn(async (args: unknown) => {
      calls.push({ table, op, args });
      if (table === 'langkahSOP' && op === 'findMany') {
        return existingLangkahIds.map((id) => ({ langkahSopId: id }));
      }
      if (table === 'langkahSOP' && op === 'count') {
        return existingLangkahIds.length;
      }
      if (table === 'langkahSOP' && op === 'create') {
        const data = (args as { data: { langkahSopId: string } }).data;
        return { langkahSopId: data.langkahSopId };
      }
      return { count: 0 };
    });

  const tx = {
    detailSOPPelaksana: {
      deleteMany: record('detailSOPPelaksana', 'deleteMany'),
      createMany: record('detailSOPPelaksana', 'createMany'),
    },
    detailSOPPelaksanaSnapshot: {
      deleteMany: record('detailSOPPelaksanaSnapshot', 'deleteMany'),
      createMany: record('detailSOPPelaksanaSnapshot', 'createMany'),
    },
    langkahSOP: {
      findMany: record('langkahSOP', 'findMany'),
      count: record('langkahSOP', 'count'),
      updateMany: record('langkahSOP', 'updateMany'),
      deleteMany: record('langkahSOP', 'deleteMany'),
      create: record('langkahSOP', 'create'),
      update: record('langkahSOP', 'update'),
    },
    detailSOP: { update: record('detailSOP', 'update') },
  };
  return { tx, calls };
}

describe('Pengujian SopProsedurRepository.updateProsedurTransaction', () => {
  function makeRepo(existingLangkahIds: string[]): {
    repo: SopProsedurRepository;
    calls: CallLog[];
  } {
    const { tx, calls } = makeTx(existingLangkahIds);
    const prismaMock = {
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<void>) => cb(tx)),
    } as unknown as PrismaService;
    const repo = new SopProsedurRepository(prismaMock);
    return { repo, calls };
  }

  it('seharusnya hanya mengganti pelaksana ketika hanya pelaksana yang dikirim', async () => {
    const { repo, calls } = makeRepo([]);
    await repo.updateProsedurTransaction({
      detailSopId: 'det-1',
      userId: 'u-1',
      input: {
        pelaksana: [
          { pelaksanaId: 'p-1', namaSnapshot: 'Pelaksana 1' },
          { pelaksanaId: 'p-2', namaSnapshot: 'Pelaksana 2' },
        ],
      },
    });
    const swimlaneOps = calls.filter((c) => c.table === 'detailSOPPelaksana');
    expect(swimlaneOps.map((c) => c.op)).toEqual(['deleteMany', 'createMany']);
    expect(calls.some((c) => c.table === 'langkahSOP' && c.op === 'deleteMany')).toBe(false);
    expect(calls.some((c) => c.table === 'detailSOP' && c.op === 'update')).toBe(true);
  });

  it('seharusnya memutus self FK, menghapus, menambahkan, lalu menghubungkan ulang', async () => {
    const { repo, calls } = makeRepo(['L-1', 'L-2']);
    await repo.updateProsedurTransaction({
      detailSopId: 'det-1',
      userId: 'u-1',
      input: {
        langkah: [
          {
            tempId: 't-1',
            jenis: JenisLangkahProsedur.KEPUTUSAN,
            kegiatan: 'cek',
            pelaksanaId: 'p-1',
            langkahSelanjutnyaYaTempId: 't-2',
          },
          {
            tempId: 't-2',
            jenis: JenisLangkahProsedur.KEGIATAN,
            kegiatan: 'lanjut',
            pelaksanaId: 'p-1',
            satuanWaktu: SatuanWaktu.h,
            waktu: 1,
          },
        ],
        defaultPelaksanaId: 'p-1',
      },
    });

    const opsOrder = calls
      .filter((c) => ['langkahSOP', 'detailSOP'].includes(c.table))
      .map((c) => `${c.table}.${c.op}`);

    const idxCount = opsOrder.indexOf('langkahSOP.count');
    const idxUpdateMany = opsOrder.indexOf('langkahSOP.updateMany');
    const idxLangkahDelete = opsOrder.indexOf('langkahSOP.deleteMany');
    const idxFirstCreate = opsOrder.indexOf('langkahSOP.create');
    const idxBranchUpdate = opsOrder.indexOf('langkahSOP.update');
    const idxDetailUpdate = opsOrder.indexOf('detailSOP.update');

    expect(idxCount).toBeGreaterThanOrEqual(0);
    expect(idxUpdateMany).toBeGreaterThan(idxCount);
    expect(idxLangkahDelete).toBeGreaterThan(idxUpdateMany);
    expect(idxFirstCreate).toBeGreaterThan(idxLangkahDelete);
    expect(idxBranchUpdate).toBeGreaterThan(idxFirstCreate);
    expect(idxDetailUpdate).toBeGreaterThan(idxBranchUpdate);

    /* Branch update hanya untuk langkah yang punya cabang. */
    const branchUpdates = calls.filter((c) => c.table === 'langkahSOP' && c.op === 'update');
    expect(branchUpdates).toHaveLength(1);
  });

  it('seharusnya menambahkan langkah baru tanpa cleanup diagram ketika belum ada langkah', async () => {
    const { repo, calls } = makeRepo([]);
    await repo.updateProsedurTransaction({
      detailSopId: 'det-1',
      userId: 'u-1',
      input: {
        langkah: [
          {
            tempId: 't-1',
            jenis: JenisLangkahProsedur.KEGIATAN,
            kegiatan: 'baru',
            pelaksanaId: 'p-1',
          },
        ],
        defaultPelaksanaId: 'p-1',
      },
    });
    expect(calls.some((c) => c.table === 'langkahSOP' && c.op === 'create')).toBe(true);
  });

});
