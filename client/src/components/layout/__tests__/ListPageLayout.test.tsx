import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import {
  PageHeaderProvider,
  usePageHeaderContext,
} from '@/components/layout/PageHeaderProvider'

function HeaderProbe() {
  const headerContent = usePageHeaderContext()?.headerContent
  return (
    <div>
      <span data-testid="header-title">{headerContent?.title ?? ''}</span>
      <span data-testid="header-breadcrumb">
        {headerContent?.breadcrumb.map((item) => item.label).join(' / ') ?? ''}
      </span>
      <span data-testid="has-description">
        {String(
          headerContent != null &&
            Object.prototype.hasOwnProperty.call(headerContent, 'description'),
        )}
      </span>
      <span data-testid="has-actions">
        {String(
          headerContent != null &&
            Object.prototype.hasOwnProperty.call(headerContent, 'actions'),
        )}
      </span>
    </div>
  )
}

describe('ListPageLayout', () => {
  it('meneruskan hanya metadata shell dan membiarkan collection controls dimiliki konten halaman', async () => {
    render(
      <PageHeaderProvider>
        <HeaderProbe />
        <ListPageLayout breadcrumb={[{ label: 'SOP' }]} title="Manajemen SOP">
          <div data-testid="page-content">Daftar</div>
        </ListPageLayout>
      </PageHeaderProvider>,
    )

    expect(await screen.findByTestId('header-title')).toHaveTextContent('Manajemen SOP')
    expect(screen.getByTestId('header-breadcrumb')).toHaveTextContent('SOP')
    expect(screen.getByTestId('has-description')).toHaveTextContent('false')
    expect(screen.getByTestId('has-actions')).toHaveTextContent('false')
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })
})
