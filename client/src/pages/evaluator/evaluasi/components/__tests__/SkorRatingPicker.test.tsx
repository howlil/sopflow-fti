import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SkorRatingPicker } from '../SkorRatingPicker'

describe('SkorRatingPicker', () => {
  it('shows a compact neutral scale helper instead of a blue instruction banner', () => {
    render(<SkorRatingPicker value={null} onChange={vi.fn()} />)

    expect(screen.getByText('Skala nilai:')).toBeInTheDocument()
    expect(screen.getByText('1 sangat rendah · 2 rendah · 3 sedang · 4 tinggi · 5 sangat tinggi.')).toBeInTheDocument()
    expect(screen.queryByText('Arti nilai: 1 adalah nilai terendah dan 5 adalah nilai tertinggi.')).not.toBeInTheDocument()
  })

  it('keeps radiogroup selection behavior', () => {
    const onChange = vi.fn()
    render(<SkorRatingPicker value={2} onChange={onChange} />)

    expect(screen.getByRole('radio', { name: '2 - Rendah' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: '4 - Tinggi' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })
})
