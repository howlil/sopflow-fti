import type { StatusSOP } from '@/types/dto/sop.dto'
import type { StatusBadgeColors } from './status-badge.types'
import { STATUS_BADGE_COLORS_DEFAULT } from './status-badge.types'

export const SOP_STATUS_BADGE_COLORS: Record<string, StatusBadgeColors> = {
  DRAFT: { color: 'text-secondary-foreground', bgColor: 'bg-surface-muted' },
  PROCESS_REVIEW: { color: 'text-amber-800', bgColor: 'bg-amber-100' },
  REVISION_REQUIRED: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  // Historical compatibility only; active workflow enters TTE_PENDING directly.
  FINAL_APPROVAL: { color: 'text-violet-800', bgColor: 'bg-violet-100' },
  TTE_PENDING: { color: 'text-violet-800', bgColor: 'bg-violet-100' },
  EFFECTIVE: { color: 'text-emerald-800', bgColor: 'bg-emerald-100' },
  SUPERSEDED: { color: 'text-secondary-foreground', bgColor: 'bg-surface-muted' },
  REVOKED: { color: 'text-rose-800', bgColor: 'bg-rose-100' },
}

const SOP_STATUS_FILTER_VALUES = [
  'DRAFT',
  'PROCESS_REVIEW',
  'REVISION_REQUIRED',
  'TTE_PENDING',
  'EFFECTIVE',
  'REVOKED',
] as const satisfies readonly StatusSOP[]

const SOP_STATUS_FILTER_LABELS: Record<(typeof SOP_STATUS_FILTER_VALUES)[number], string> = {
  DRAFT: 'Draf',
  PROCESS_REVIEW: 'Dalam Pemeriksaan Proses Bisnis',
  REVISION_REQUIRED: 'Memerlukan Perbaikan',
  TTE_PENDING: 'Menunggu Tanda Tangan Elektronik',
  EFFECTIVE: 'Berlaku',
  REVOKED: 'Dicabut',
}

export const SOP_STATUS_LABELS: Record<string, string> = {
  ...SOP_STATUS_FILTER_LABELS,
  FINAL_APPROVAL: 'Menunggu Tanda Tangan Elektronik',
  SUPERSEDED: 'Digantikan',
}

export function getSopStatusLabel(status: string): string {
  return SOP_STATUS_LABELS[status] ?? 'Status tidak dikenal'
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
