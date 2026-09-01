import type { BreadcrumbItem } from '@/components/ui/breadcrumb'
import { SetPageHeader } from '@/components/layout/PageHeaderProvider'

export interface ListPageLayoutProps {
  /** Item breadcrumb. Opsional: null/undefined = tidak tampil breadcrumb. */
  breadcrumb?: BreadcrumbItem[] | null
  /** Judul semantik halaman. */
  title: string
  /** @deprecated Deskripsi tidak lagi dirender di global shell. */
  description?: string
  /** Konten collection/page lokal. */
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper metadata untuk halaman list. Collection controls dimiliki children,
 * biasanya melalui DataSurface, bukan global header.
 */
export function ListPageLayout({
  breadcrumb,
  title,
  children,
  className,
}: ListPageLayoutProps) {
  return (
    <div className={className ?? 'space-y-4 sm:space-y-section'}>
      <SetPageHeader breadcrumb={breadcrumb ?? []} title={title} />
      {children}
    </div>
  )
}
