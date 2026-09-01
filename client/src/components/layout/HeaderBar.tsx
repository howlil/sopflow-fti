import { Breadcrumb } from '@/components/ui/breadcrumb'
import { NotificationBell } from './NotificationBell'
import { usePageHeaderContext } from '@/components/layout/PageHeaderProvider'

export function HeaderBar() {
  const headerContent = usePageHeaderContext()?.headerContent

  return (
    <header
      data-print-hide
      className="flex min-h-[var(--header-height)] flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2 md:px-5 lg:px-6"
    >
      <div suppressHydrationWarning className="min-w-0 flex-1">
        {headerContent?.breadcrumb.length ? (
          <Breadcrumb
            items={headerContent.breadcrumb}
            className="min-w-0 overflow-hidden whitespace-nowrap"
          />
        ) : null}
        {headerContent ? <h1 className="sr-only">{headerContent.title}</h1> : null}
      </div>
      <NotificationBell />
    </header>
  )
}
