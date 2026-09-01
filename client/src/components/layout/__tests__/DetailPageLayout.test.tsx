import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}))

import { DetailPageLayout } from '@/components/layout/DetailPageLayout'
import { HeaderBar } from '@/components/layout/HeaderBar'
import { PageHeaderProvider } from '@/components/layout/PageHeaderProvider'

describe('DetailPageLayout', () => {
  it('menggunakan breadcrumb sebagai navigasi balik tanpa standalone back row', async () => {
    render(
      <PageHeaderProvider>
        <HeaderBar />
        <DetailPageLayout
          breadcrumb={[
            { label: 'Manajemen SOP', to: '/penyusun/sop' },
            { label: 'Edit SOP' },
          ]}
          title="Edit Dokumen SOP"
          main={<div>Dokumen</div>}
        />
      </PageHeaderProvider>,
    )

    expect(await screen.findByRole('link', { name: 'Manajemen SOP' })).toHaveAttribute(
      'href',
      '/penyusun/sop',
    )
    expect(screen.getByText('Edit SOP')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByTitle('Kembali')).not.toBeInTheDocument()
    expect(screen.queryByText('Kembali')).not.toBeInTheDocument()
    expect(screen.getByText('Dokumen')).toBeInTheDocument()
  })

  it('memberi panel kiri ruang penuh untuk lebar workbench SOP', () => {
    render(
      <PageHeaderProvider>
        <DetailPageLayout
          title="Workspace Pengesahan"
          leftPanel={<div data-testid="left-panel-content">Daftar SOP</div>}
          main={<div>Preview SOP</div>}
        />
      </PageHeaderProvider>,
    )

    const leftPanelContent = screen.getByTestId('left-panel-content')
    expect(leftPanelContent.parentElement).toHaveClass('lg:max-w-[min(340px,36vw)]')
  })
})
