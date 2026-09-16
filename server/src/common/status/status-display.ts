import { StatusSOP } from '../../generated/prisma';

export interface StatusDisplay {
  readonly value: string;
  readonly label: string;
}

const SOP_STATUS_LABELS: Record<StatusSOP, string> = {
  [StatusSOP.DRAFT]: 'Draf',
  [StatusSOP.PROCESS_REVIEW]: 'Dalam Pemeriksaan Proses Bisnis',
  [StatusSOP.REVISION_REQUIRED]: 'Memerlukan Perbaikan',
  [StatusSOP.FINAL_APPROVAL]: 'Menunggu Tanda Tangan Elektronik',
  [StatusSOP.TTE_PENDING]: 'Menunggu Tanda Tangan Elektronik',
  [StatusSOP.EFFECTIVE]: 'Berlaku',
  [StatusSOP.SUPERSEDED]: 'Digantikan',
  [StatusSOP.REVOKED]: 'Dicabut',
};

function resolveEnumLabel<T extends string>(
  value: T | null | undefined,
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

export function displayStatusSop(status: string): StatusDisplay {
  return resolveEnumLabel(status, SOP_STATUS_LABELS, 'Status tidak dikenal');
}
