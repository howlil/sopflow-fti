import { StatusSOP } from '../../generated/prisma';

export interface StatusDisplay {
  readonly value: string;
  readonly label: string;
}

const SOP_STATUS_LABELS: Record<StatusSOP, string> = {
  [StatusSOP.DRAFT]: 'Draft',
  [StatusSOP.PROCESS_REVIEW]: 'Dalam review Proses',
  [StatusSOP.REVISION_REQUIRED]: 'Perlu revisi',
  [StatusSOP.FINAL_APPROVAL]: 'Menunggu persetujuan akhir',
  [StatusSOP.TTE_PENDING]: 'Menunggu TTE',
  [StatusSOP.EFFECTIVE]: 'Berlaku',
  [StatusSOP.SUPERSEDED]: 'Digantikan',
  [StatusSOP.REVOKED]: 'Dicabut',
};

function resolveEnumLabel<T extends string>(
  value: T | string | null | undefined,
  labels: Record<string, string>,
  fallbackLabel: string,
): StatusDisplay {
  const key = value === null || value === undefined ? '' : String(value);
  if (key === '') {
    return { value: '', label: fallbackLabel };
  }
  const label = labels[key];
  return { value: key, label: label ?? fallbackLabel };
}

export function displayStatusSop(status: StatusSOP | string): StatusDisplay {
  return resolveEnumLabel(status, SOP_STATUS_LABELS, 'Status tidak dikenal');
}
