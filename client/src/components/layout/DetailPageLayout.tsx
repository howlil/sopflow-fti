import * as React from 'react'
import { cn } from '@/utils/cn'
import { SetPageHeader } from '@/components/layout/PageHeaderProvider'
import type { BreadcrumbItem } from '@/components/ui/breadcrumb'

interface DetailWorkspaceProps {
  className?: string
  header?: React.ReactNode
  leftPanel?: React.ReactNode
  main: React.ReactNode
  rightPanel?: React.ReactNode
}

function DetailWorkspace({
  className,
  header,
  leftPanel,
  main,
  rightPanel,
}: DetailWorkspaceProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-surface border border-border bg-surface shadow-surface',
        className,
      )}
    >
      {header != null && (
        <div
          data-print-hide
          className="flex-shrink-0 border-b border-border bg-surface px-4 py-3 sm:px-5"
        >
          {header}
        </div>
      )}
      <div className="flex flex-1 min-h-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {leftPanel != null && (
          <div
            data-print-hide
            className="flex flex-col h-full max-h-[min(46vh,340px)] shrink-0 overflow-hidden border-b border-border bg-surface-subtle lg:max-h-none lg:max-w-[min(340px,36vw)] lg:border-b-0 lg:border-r"
          >
            {leftPanel}
          </div>
        )}
        <div className="flex min-h-[40vh] min-w-0 flex-1 flex-col overflow-hidden bg-surface p-3 sm:p-4 lg:border-r lg:border-border">
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {main}
          </div>
        </div>
        {rightPanel != null && (
          <div
            data-print-hide
            className="flex flex-col h-full max-h-[min(52vh,440px)] shrink-0 overflow-hidden border-t border-border bg-surface-subtle lg:max-h-none lg:max-w-[min(340px,28vw)] lg:border-l lg:border-t-0"
          >
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  )
}

export interface DetailPageLayoutProps {
  breadcrumb?: BreadcrumbItem[] | null
  title: string
  /** @deprecated Deskripsi tidak lagi dirender di global shell. */
  description?: string
  /** @deprecated Navigasi balik detail sekarang hanya melalui breadcrumb. */
  backTo?: string
  /** @deprecated Navigasi balik detail sekarang hanya melalui breadcrumb. */
  backSize?: 'default' | 'icon'
  /** @deprecated Aksi detail harus hidup di workspace header/page-local command region. */
  actions?: React.ReactNode
  header?: React.ReactNode
  main?: React.ReactNode
  children?: React.ReactNode
  leftPanel?: React.ReactNode
  rightPanel?: React.ReactNode
  className?: string
  workspaceClassName?: string
}

export function DetailPageLayout({
  breadcrumb,
  title,
  header,
  main,
  children,
  leftPanel,
  rightPanel,
  className,
  workspaceClassName,
}: DetailPageLayoutProps) {
  const mainContent = main ?? children

  return (
    <div
      suppressHydrationWarning
      className={className ?? 'flex h-[calc(100vh-5rem)] min-h-0 flex-col gap-3 sm:gap-4'}
    >
      <SetPageHeader breadcrumb={breadcrumb ?? []} title={title} />
      <DetailWorkspace
        className={workspaceClassName}
        header={header}
        leftPanel={leftPanel}
        main={mainContent}
        rightPanel={rightPanel}
      />
    </div>
  )
}
