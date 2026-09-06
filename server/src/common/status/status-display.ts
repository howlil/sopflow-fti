import { StatusSOP } from '../../generated/prisma';

export interface StatusDisplay {
  readonly value: string;
  readonly label: string;
}

const SOP_STATUS_LABELS: Record<StatusSOP, string> = {
  [StatusSOP.DRAFT]: 'Draft',
  [StatusSOP.SEDANG_DISUSUN]: 'Sedang disusun',
  [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI]: 'Siap diajukan untuk review',
  [StatusSOP.DIAJUKAN_EVALUASI]: 'Diajukan untuk review Proses',
  [StatusSOP.SEDANG_DIEVALUASI]: 'Dalam review Proses',
  [StatusSOP.REVISI_DARI_EVALUATOR]: 'Perlu revisi',
  [StatusSOP.DITOLAK_EVALUATOR]: 'Review tidak diterima',
  [StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR]: 'Menunggu persetujuan akhir',
  [StatusSOP.DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI]: 'Menunggu TTE',
  [StatusSOP.BERLAKU]: 'Berlaku',
  [StatusSOP.DIGANTIKAN]: 'Digantikan',
  [StatusSOP.DICABUT]: 'Dicabut',
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

/** Status dokumen SOP; enum persistence lama diproyeksikan ke vocabulary FTI. */
export function displayStatusSop(status: StatusSOP | string): StatusDisplay {
  return resolveEnumLabel(status, SOP_STATUS_LABELS, 'Status tidak dikenal');
}
