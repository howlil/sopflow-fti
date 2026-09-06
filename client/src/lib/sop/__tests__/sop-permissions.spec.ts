import { describe, expect, it } from 'vitest'
import {
  canBuatVersiBaru,
  canEditSop,
  canHapusSopDraftAwal,
  canHapusVersiDraft,
} from '../sop-permissions'

describe('sop-permissions', () => {
  it('allows editing only authoring/revision states', () => {
    expect(canEditSop('DRAFT')).toBe(true)
    expect(canEditSop('SEDANG_DISUSUN')).toBe(true)
    expect(canEditSop('REVISI_DARI_EVALUATOR')).toBe(true)
    expect(canEditSop('BERLAKU')).toBe(false)
  })

  it('uses server-projected version capability instead of legacy role', () => {
    expect(canBuatVersiBaru({ canBuatVersiBaru: true })).toBe(true)
    expect(canBuatVersiBaru({ canBuatVersiBaru: false })).toBe(false)
  })

  it('only allows deleting an explicitly deletable draft version', () => {
    expect(canHapusVersiDraft('DRAFT', true)).toBe(true)
    expect(canHapusVersiDraft('DRAFT', false)).toBe(false)
    expect(canHapusVersiDraft('BERLAKU', true)).toBe(false)
  })

  it('only allows deleting the initial SOP draft', () => {
    expect(canHapusSopDraftAwal({ status: 'DRAFT', versi: 1, canHapusSopDraft: true })).toBe(true)
    expect(canHapusSopDraftAwal({ status: 'SEDANG_DISUSUN', versi: 1, canHapusSopDraft: true })).toBe(false)
    expect(canHapusSopDraftAwal({ status: 'DRAFT', versi: 2, canHapusSopDraft: true })).toBe(false)
    expect(canHapusSopDraftAwal({ status: 'DRAFT', versi: 1, canHapusSopDraft: false })).toBe(false)
  })
})
