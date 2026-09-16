import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HeaderBar } from '@/components/layout/HeaderBar'
import {
  PageHeaderProvider,
  SetPageHeader,
} from '@/components/layout/PageHeaderProvider'

describe('HeaderBar', () => {
  it('menampilkan breadcrumb sebagai satu-satunya identitas halaman', async () => {
    render(
      <PageHeaderProvider>
        <HeaderBar />
        <SetPageHeader
          breadcrumb={[{ label: 'SOP' }]}
          title="SOP"
        />
      </PageHeaderProvider>,
    )

    const breadcrumb = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByText('SOP')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('heading', { name: 'SOP' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Profil' })).not.toBeInTheDocument()
  })

  it('tidak membuat breadcrumb atau judul duplikat saat breadcrumb kosong', async () => {
    render(
      <PageHeaderProvider>
        <HeaderBar />
        <SetPageHeader breadcrumb={[]} title="Ringkasan" />
      </PageHeaderProvider>,
    )

    expect(screen.queryByRole('heading', { name: 'Ringkasan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument()
  })
})
