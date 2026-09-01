import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataSurface } from '@/components/data/data-surface'

describe('DataSurface', () => {
  it('menyatukan tabs, toolbar, actions, dan konten dalam satu surface responsif', () => {
    render(
      <DataSurface.Root>
        <DataSurface.Header>
          <DataSurface.Tabs data-testid="data-tabs">
            <button type="button">Semua</button>
          </DataSurface.Tabs>
          <DataSurface.Toolbar data-testid="data-toolbar">
            <input aria-label="Cari SOP" />
            <button type="button">Filter</button>
            <DataSurface.Actions data-testid="data-actions">
              <button type="button">Buat SOP</button>
            </DataSurface.Actions>
          </DataSurface.Toolbar>
        </DataSurface.Header>
        <div>Isi tabel</div>
      </DataSurface.Root>,
    )

    expect(screen.getByTestId('data-surface')).toHaveClass(
      'rounded-surface',
      'border',
      'border-border',
      'bg-surface',
    )
    expect(screen.getByTestId('data-toolbar')).toHaveClass('flex-col', 'sm:flex-row')
    expect(screen.getByTestId('data-actions')).toHaveClass('flex-wrap', 'sm:ml-auto')
    expect(screen.getByTestId('data-tabs')).toHaveClass('overflow-x-auto')
    expect(screen.getByLabelText('Cari SOP')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buat SOP' })).toBeInTheDocument()
  })
})
