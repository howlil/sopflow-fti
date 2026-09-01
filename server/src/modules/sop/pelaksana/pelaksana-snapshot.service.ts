import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';

type WorkbenchSwimlane = Record<string, unknown> & {
  pelaksanaId: string;
  pelaksana?: (Record<string, unknown> & { namaPelaksana: string }) | null;
};

function isWorkbenchSwimlane(value: unknown): value is WorkbenchSwimlane {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.pelaksanaId !== 'string') return false;
  const pelaksana = candidate.pelaksana;
  return (
    pelaksana === undefined ||
    pelaksana === null ||
    (typeof pelaksana === 'object' &&
      pelaksana !== null &&
      typeof (pelaksana as Record<string, unknown>).namaPelaksana === 'string')
  );
}

@Injectable()
export class PelaksanaSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async applyToWorkbench(
    workbench: PenyusunWorkbenchDataDto,
  ): Promise<PenyusunWorkbenchDataDto> {
    const detailSopId = workbench.detail.id;
    const rows = await this.prisma.detailSOPPelaksanaSnapshot.findMany({
      where: { detailSopId },
      select: { pelaksanaId: true, namaSnapshot: true },
    });
    if (rows.length === 0) return workbench;

    const snapshotById = new Map(rows.map((row) => [row.pelaksanaId, row.namaSnapshot]));
    const swimlanes = workbench.detail.swimlanes?.map((value) => {
      if (!isWorkbenchSwimlane(value) || value.pelaksana == null) return value;
      const snapshot = snapshotById.get(value.pelaksanaId);
      return snapshot === undefined
        ? value
        : {
            ...value,
            pelaksana: { ...value.pelaksana, namaPelaksana: snapshot },
          };
    });

    return {
      ...workbench,
      detail: {
        ...workbench.detail,
        swimlanes,
      },
      langkah: workbench.langkah.map((step) => {
        if (!step.pelaksana) return step;
        const snapshot = snapshotById.get(step.pelaksanaId);
        return snapshot === undefined
          ? step
          : { ...step, pelaksana: { ...step.pelaksana, namaPelaksana: snapshot } };
      }),
    };
  }
}
