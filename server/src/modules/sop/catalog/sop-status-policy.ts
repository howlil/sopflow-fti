import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PeranPengguna, StatusSOP } from '../../../generated/prisma';

export type SopStatusTransitionInput = {
  /** Hydrated only by the explicit legacy `@Roles` compatibility guard. */
  role: PeranPengguna | undefined;
  current: StatusSOP;
  target: StatusSOP;
};

/** Compatibility-only OPD workflow policy. Native Process lifecycle does not call this function. */
export function assertAllowedSopStatusTransition(input: SopStatusTransitionInput): void {
  const { role, current, target } = input;
  if (current === target) {
    throw new ConflictException('Status SOP sudah sesuai permintaan');
  }
  if (target === StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI) {
    const allowedFrom = new Set<StatusSOP>([
      StatusSOP.DRAFT,
      StatusSOP.SEDANG_DISUSUN,
      StatusSOP.REVISI_DARI_EVALUATOR,
    ]);
    if (!allowedFrom.has(current)) {
      throw new ConflictException(
        `Tidak dapat mengubah status ke MENUNGGU_PENGAJUAN_EVALUASI dari status ${String(current)}`,
      );
    }
    if (role !== PeranPengguna.PENYUSUN && role !== PeranPengguna.PJ_PENYUSUN) {
      throw new ForbiddenException(
        'Hanya penyusun compatibility yang dapat menandai SOP menunggu pengajuan evaluasi',
      );
    }
    return;
  }
  if (target === StatusSOP.DIAJUKAN_EVALUASI) {
    if (current !== StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI) {
      throw new ConflictException(
        `Hanya SOP berstatus MENUNGGU_PENGAJUAN_EVALUASI yang dapat diajukan ke evaluasi (status saat ini: ${String(current)})`,
      );
    }
    if (role !== PeranPengguna.PJ_PENYUSUN) {
      throw new ForbiddenException('Hanya PJ Penyusun compatibility yang dapat mengajukan SOP ke evaluasi');
    }
    return;
  }
  if (target === StatusSOP.BERLAKU) {
    throw new ConflictException(
      'Pengesahan SOP legacy menjadi BERLAKU wajib melalui endpoint TTE compatibility',
    );
  }
  if (target === StatusSOP.DICABUT) {
    if (current !== StatusSOP.BERLAKU) {
      throw new ConflictException('Hanya SOP berstatus BERLAKU yang dapat dicabut');
    }
    if (role !== PeranPengguna.KEPALA_OPD) {
      throw new ForbiddenException('Hanya Kepala OPD compatibility yang dapat mencabut SOP legacy');
    }
    return;
  }
  throw new ConflictException(`Transisi ke ${String(target)} tidak diizinkan melalui endpoint legacy`);
}
