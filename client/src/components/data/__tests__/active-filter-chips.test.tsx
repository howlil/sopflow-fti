import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActiveFilterChips } from '@/components/data/active-filter-chips'

describe('ActiveFilterChips', () => {
  it('menghapus filter individual dan seluruh filter secara eksplisit', () => {
    const remove = vi.fn()
    const clearAll = vi.fn()

    render(
      <ActiveFilterChips
        items={[{ id: 'status', label: 'Status: Draft', onRemove: remove }]}
        onClearAll={clearAll}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hapus filter Status: Draft' }))
    expect(remove).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Hapus semua filter' }))
    expect(clearAll).toHaveBeenCalledTimes(1)
  })

  it('tidak merender filter row ketika tidak ada filter aktif', () => {
    const { container } = render(<ActiveFilterChips items={[]} onClearAll={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('button', { name: 'Hapus semua filter' })).not.toBeInTheDocument()
  })
})
