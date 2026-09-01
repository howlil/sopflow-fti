import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { PenyusunWorkbenchDataDto } from '../catalog/dto/penyusun-workbench-data.dto';

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
    return {
      ...workbench,
      detail: {
        ...workbench.detail,
        swimlanes: workbench.detail.swimlanes?.map((swimlane) => {
          if (!swimlane.pelaksana) return swimlane;
          const snapshot = snapshotById.get(swimlane.pelaksanaId);
          return snapshot === undefined
            ? swimlane
            : {
                ...swimlane,
                pelaksana: { ...swimlane.pelaksana, namaPelaksana: snapshot },
              };
        }),
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
