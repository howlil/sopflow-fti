import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HeaderBar } from '@/components/layout/HeaderBar'
import {
  PageHeaderProvider,
  SetPageHeader,
} from '@/components/layout/PageHeaderProvider'

describe('HeaderBar', () => {
  it('menampilkan breadcrumb dan judul halaman sebagai identitas visual', async () => {
    render(
      <PageHeaderProvider>
        <HeaderBar />
        <SetPageHeader
          breadcrumb={[{ label: 'Penyusun' }, { label: 'Daftar SOP' }]}
          title="Daftar SOP"
        />
      </PageHeaderProvider>,
    )

    const breadcrumb = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByText('Penyusun')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Daftar SOP')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: 'Daftar SOP' })).not.toHaveClass('sr-only')
    expect(screen.queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
  })

  it('tidak membuat breadcrumb kosong dan tetap menyediakan judul semantik', async () => {
    render(
      <PageHeaderProvider>
        <HeaderBar />
        <SetPageHeader breadcrumb={[]} title="Ringkasan" />
      </PageHeaderProvider>,
    )

    const heading = await screen.findByRole('heading', { name: 'Ringkasan' })
    expect(heading).not.toHaveClass('sr-only')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })
})
