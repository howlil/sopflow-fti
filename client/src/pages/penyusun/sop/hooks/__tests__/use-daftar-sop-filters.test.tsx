import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDaftarSopFilters } from '@/pages/penyusun/sop/hooks/use-daftar-sop-filters'

describe('useDaftarSopFilters', () => {
  it('mereset advanced filters tanpa menghapus search query', () => {
    const { result } = renderHook(() => useDaftarSopFilters())

    act(() => {
      result.current.setSearchQuery('pengadaan')
      result.current.setStatusFilter('DRAFT')
      result.current.setFilterTanggalDari('2026-08-01')
    })

    expect(result.current.activeFilterCount).toBe(2)

    act(() => result.current.clearFilters())
    expect(result.current.searchQuery).toBe('pengadaan')
    expect(result.current.filterStatus).toBeNull()
    expect(result.current.filterTanggalDari).toBeNull()
    expect(result.current.activeFilterCount).toBe(0)

    act(() => result.current.clearSearch())
    expect(result.current.searchQuery).toBe('')
  })
})
