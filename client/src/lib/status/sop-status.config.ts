import type { StatusSOP } from '@/types/dto/sop.dto'
import type { StatusBadgeColors } from './status-badge.types'
import { STATUS_BADGE_COLORS_DEFAULT } from './status-badge.types'

export const SOP_STATUS_BADGE_COLORS: Record<string, StatusBadgeColors> = {
  DRAFT: { color: 'text-secondary-foreground', bgColor: 'bg-surface-muted' },
  PROCESS_REVIEW: { color: 'text-amber-800', bgColor: 'bg-amber-100' },
  REVISION_REQUIRED: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  FINAL_APPROVAL: { color: 'text-teal-800', bgColor: 'bg-teal-100' },
  TTE_PENDING: { color: 'text-violet-800', bgColor: 'bg-violet-100' },
  EFFECTIVE: { color: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  SUPERSEDED: { color: 'text-secondary-foreground', bgColor: 'bg-surface-muted' },
  REVOKED: { color: 'text-rose-800', bgColor: 'bg-rose-100' },
}

const SOP_STATUS_FILTER_VALUES = [
  'DRAFT',
  'PROCESS_REVIEW',
  'REVISION_REQUIRED',
  'FINAL_APPROVAL',
  'TTE_PENDING',
  'EFFECTIVE',
  'REVOKED',
] as const satisfies readonly StatusSOP[]

const SOP_STATUS_FILTER_LABELS: Record<(typeof SOP_STATUS_FILTER_VALUES)[number], string> = {
  DRAFT: 'Draft',
  PROCESS_REVIEW: 'Dalam review Proses',
  REVISION_REQUIRED: 'Perlu revisi',
  FINAL_APPROVAL: 'Menunggu persetujuan akhir',
  TTE_PENDING: 'Menunggu TTE',
  EFFECTIVE: 'Berlaku',
  REVOKED: 'Dicabut',
}

export function getSopStatusColors(status: string): StatusBadgeColors {
  return SOP_STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS_DEFAULT
}

export const SOP_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Semua Status' },
  ...SOP_STATUS_FILTER_VALUES.map((value) => ({
    value,
    label: SOP_STATUS_FILTER_LABELS[value],
  })),
] as const
