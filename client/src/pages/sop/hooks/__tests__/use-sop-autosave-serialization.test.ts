import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useSopHeaderAutosave,
  type SopHeaderSnapshot,
} from '@/pages/sop/hooks/use-sop-header-autosave'
import {
  useSopProsedurAutosave,
  type SopProsedurSnapshot,
} from '@/pages/sop/hooks/use-sop-prosedur-autosave'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

const headerSnapshot: SopHeaderSnapshot = {
  judul: 'Judul awal',
  nomorSOP: '01',
  namaLembaga: 'FTI',
  peringatan: [],
  dasarHukumPeraturanIds: [],
  sopTerkaitDetailIds: [],
  kualifikasiPelaksanaan: [],
  peralatanPerlengkapan: [],
  pencatatanPendataan: [],
}

const prosedurSnapshot: SopProsedurSnapshot = {
  pelaksana: [],
  langkah: [],
}

describe('autosave serialization', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('serializes header saves and persists the latest snapshot after the first request', async () => {
    const first = deferred()
    const second = deferred()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { rerender } = renderHook(
      ({ snapshot }) => useSopHeaderAutosave({ detailSopId: 'detail-1', snapshot, save, debounceMs: 10 }),
      { initialProps: { snapshot: headerSnapshot } },
    )

    rerender({ snapshot: { ...headerSnapshot, judul: 'Judul A' } })
    await act(async () => {
      vi.advanceTimersByTime(10)
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(1)

    rerender({ snapshot: { ...headerSnapshot, judul: 'Judul B' } })
    await act(async () => {
      vi.advanceTimersByTime(10)
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve()
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0]).toEqual({ judul: 'Judul B' })

    await act(async () => {
      second.resolve()
      await settle()
    })
  })

  it('serializes procedure saves and sends the newest replace-all section next', async () => {
    const first = deferred()
    const second = deferred()
    const save = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { rerender } = renderHook(
      ({ snapshot }) => useSopProsedurAutosave({ detailSopId: 'detail-1', snapshot, save, debounceMs: 10 }),
      { initialProps: { snapshot: prosedurSnapshot } },
    )

    rerender({ snapshot: { pelaksana: [{ pelaksanaId: 'p1' }], langkah: [] } })
    await act(async () => {
      vi.advanceTimersByTime(10)
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(1)

    rerender({ snapshot: { pelaksana: [{ pelaksanaId: 'p2' }], langkah: [] } })
    await act(async () => {
      vi.advanceTimersByTime(10)
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve()
      await settle()
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0]).toEqual({ pelaksana: [{ pelaksanaId: 'p2' }] })

    await act(async () => {
      second.resolve()
      await settle()
    })
  })
})
