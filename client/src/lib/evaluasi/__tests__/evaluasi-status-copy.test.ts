import { describe, expect, it } from 'vitest'
import { getEvaluasiStatusBanner } from '../evaluasi-status-copy'

describe('getEvaluasiStatusBanner', () => {
  it('reserves success tone for the final workflow state', () => {
    expect(getEvaluasiStatusBanner('SEDANG_DIEVALUASI')?.variant).toBe('info')
    expect(getEvaluasiStatusBanner('SELESAI_DIEVALUASI')?.variant).toBe('warning')
    expect(getEvaluasiStatusBanner('DITANDATANGANI_PJ_EVALUATOR')?.variant).toBe('warning')
    expect(getEvaluasiStatusBanner('DITANDATANGANI_PJ_PENYUSUN')?.variant).toBe('warning')
    expect(getEvaluasiStatusBanner('SELESAI')?.variant).toBe('success')
  })
})
