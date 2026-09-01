import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InlineHelperNote } from '../inline-helper-note'

describe('InlineHelperNote', () => {
  it('renders compact neutral helper copy without alert semantics', () => {
    render(<InlineHelperNote label="Skala nilai">1 sangat rendah, 5 sangat tinggi.</InlineHelperNote>)

    expect(screen.getByText('Skala nilai:')).toBeInTheDocument()
    expect(screen.getByText('1 sangat rendah, 5 sangat tinggi.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('supports semantic warning and danger tones without changing content', () => {
    const { rerender } = render(<InlineHelperNote tone="warning">Perlu perhatian.</InlineHelperNote>)
    expect(screen.getByText('Perlu perhatian.')).toBeInTheDocument()

    rerender(<InlineHelperNote tone="danger">Tidak dapat diproses.</InlineHelperNote>)
    expect(screen.getByText('Tidak dapat diproses.')).toBeInTheDocument()
  })
})
