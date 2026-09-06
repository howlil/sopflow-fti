import type { StatusSOP } from '@/types/dto/sop.dto'

export function canEditSop(status: StatusSOP): boolean {
  return status === 'DRAFT' || status === 'SEDANG_DISUSUN' || status === 'REVISI_DARI_EVALUATOR'
}

export function canBuatVersiBaru(row: { canBuatVersiBaru?: boolean }): boolean {
  return row.canBuatVersiBaru === true
}

export function canHapusVersiDraft(status: StatusSOP, canHapusDraft?: boolean): boolean {
  return status === 'DRAFT' && canHapusDraft === true
}

export function canHapusSopDraftAwal(row: {
  status: string
  versi?: number | null
  canHapusSopDraft?: boolean
}): boolean {
  return row.status === 'DRAFT' && row.versi === 1 && row.canHapusSopDraft === true
}
