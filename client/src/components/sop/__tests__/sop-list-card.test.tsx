import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SOPListCard } from '../sop-list-card'

describe('SOPListCard', () => {
  it('matches the restrained workspace card pattern for compact SOP items', () => {
    const onSelect = vi.fn()

    render(
      <SOPListCard
        variant="compact"
        selectedId="sop-1"
        onSelect={onSelect}
        items={[
          {
            id: 'sop-1',
            nama: 'sop lama',
            nomor: '123456',
            statusDokumen: 'BERLAKU',
            statusDokumenLabel: 'Berlaku',
            hasilEvaluasi: 'SESUAI',
            hasilEvaluasiLabel: 'Sesuai',
          },
          {
            id: 'sop-2',
            nama: 'sop barang',
            nomor: '654321',
            statusDokumen: 'DRAFT',
            statusDokumenLabel: 'Draft',
          },
        ]}
      />,
    )

    const selectedCard = screen.getByRole('button', { name: /sop lama/i })
    const idleCard = screen.getByRole('button', { name: /sop barang/i })
    const list = selectedCard.parentElement

    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(selectedCard).toHaveClass('rounded-control')
    expect(selectedCard).toHaveClass('border')
    expect(selectedCard).toHaveClass('border-primary')
    expect(selectedCard).toHaveClass('bg-primary-subtle')
    expect(selectedCard).not.toHaveClass('rounded-none')
    expect(selectedCard).not.toHaveClass('border-x-0')
    expect(selectedCard).not.toHaveClass('bg-surface-subtle')
    expect(selectedCard.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()

    expect(idleCard).toHaveClass('rounded-control')
    expect(idleCard).toHaveClass('border-border')
    expect(idleCard).toHaveClass('bg-surface')

    expect(list).toHaveClass('space-y-2')
    expect(list).toHaveClass('px-2')

    expect(screen.queryByText('Dokumen')).not.toBeInTheDocument()
    expect(screen.queryByText('Penilaian')).not.toBeInTheDocument()
    expect(screen.getByText('Berlaku')).toHaveClass('rounded-sm')
    expect(screen.getByText('Sesuai')).toHaveClass('rounded-sm')
    expect(screen.getByText('Berlaku')).toHaveClass('text-success-foreground')
    expect(screen.getByText('Sesuai')).toHaveClass('text-success-foreground')
  })

  it('does not render pending process states as final green chips', () => {
    render(
      <SOPListCard
        selectedId="sop-1"
        items={[
          {
            id: 'sop-1',
            nama: 'sop barang',
            nomor: '1234',
            statusDokumen: 'DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
            statusDokumenLabel: 'Menunggu TTD PJ Evaluator',
          },
        ]}
      />,
    )

    const status = screen.getByText('Menunggu TTD PJ Evaluator')
    expect(status).toHaveClass('text-warning-foreground')
    expect(status).not.toHaveClass('text-success-foreground')
  })
})
