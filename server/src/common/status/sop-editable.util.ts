import { ConflictException } from '@nestjs/common';
import { StatusSOP } from '../../generated/prisma';

const EDITABLE_STATUSES: ReadonlySet<StatusSOP> = new Set([
  StatusSOP.DRAFT,
  StatusSOP.REVISION_REQUIRED,
]);

/** Status terminal — versi tidak boleh diedit isi dokumen. */
export const TERMINAL_DETAIL_STATUSES: ReadonlySet<StatusSOP> = new Set([
  StatusSOP.EFFECTIVE,
  StatusSOP.SUPERSEDED,
  StatusSOP.REVOKED,
]);

export function isDetailSopEditable(status: StatusSOP): boolean {
  return EDITABLE_STATUSES.has(status);
}

export function assertDetailSopEditable(status: StatusSOP): void {
  if (!isDetailSopEditable(status)) {
    throw new ConflictException(
      `DetailSOP berstatus ${String(status)} tidak dapat diubah. Hanya DRAFT atau REVISION_REQUIRED yang dapat diedit.`,
    );
  }
}

export function hasRevisiInFlight(statuses: StatusSOP[]): boolean {
  return statuses.some((s) => !TERMINAL_DETAIL_STATUSES.has(s));
}
