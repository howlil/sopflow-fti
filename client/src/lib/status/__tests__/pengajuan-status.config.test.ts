import { describe, expect, it } from 'vitest'
import { getPengajuanStatusColors } from '../pengajuan-status.config'

describe('pengajuan status colors', () => {
  it('uses semantic tones for progress, waiting, final, and destructive states', () => {
    expect(getPengajuanStatusColors('SEDANG_DIEVALUASI')).toEqual({
      color: 'text-sky-800',
      bgColor: 'bg-sky-100',
    })

    for (const status of [
      'SELESAI_DIEVALUASI',
      'DITANDATANGANI_PJ_EVALUATOR',
      'DITANDATANGANI_PJ_PENYUSUN',
    ]) {
      expect(getPengajuanStatusColors(status)).toEqual({
        color: 'text-amber-800',
        bgColor: 'bg-amber-100',
      })
    }

    expect(getPengajuanStatusColors('SELESAI')).toEqual({
      color: 'text-emerald-800',
      bgColor: 'bg-emerald-100',
    })
    expect(getPengajuanStatusColors('DITOLAK')).toEqual({
      color: 'text-red-800',
      bgColor: 'bg-red-100',
    })
  })
})
