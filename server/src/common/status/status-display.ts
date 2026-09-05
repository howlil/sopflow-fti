import { StatusSOP } from '../../generated/prisma';

export interface StatusDisplay {
  readonly value: string;
  readonly label: string;
}

const SOP_STATUS_LABELS: Record<StatusSOP, string> = {
  [StatusSOP.DRAFT]: 'Draft',
  [StatusSOP.SEDANG_DISUSUN]: 'Sedang disusun',
  [StatusSOP.MENUNGGU_PENGAJUAN_EVALUASI]: 'Menunggu pengajuan evaluasi',
  [StatusSOP.DIAJUKAN_EVALUASI]: 'Diajukan evaluasi',
  [StatusSOP.SEDANG_DIEVALUASI]: 'Dalam penilaian',
  [StatusSOP.REVISI_DARI_EVALUATOR]: 'Perlu revisi',
  [StatusSOP.DITOLAK_EVALUATOR]: 'Ditolak evaluator',
  [StatusSOP.MENUNGGU_TTD_PJ_EVALUATOR]: 'Menunggu TTD PJ Evaluator',
  [StatusSOP.DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI]: 'Menunggu pengesahan Kepala OPD',
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

/** Status dokumen SOP (enum StatusSOP). */
export function displayStatusSop(status: StatusSOP | string): StatusDisplay {
  return resolveEnumLabel(status, SOP_STATUS_LABELS, 'Status tidak dikenal');
}
