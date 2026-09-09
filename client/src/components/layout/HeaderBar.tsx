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
        {headerContent ? (
          <div className="min-w-0">
            {headerContent.breadcrumb.length ? (
              <Breadcrumb
                items={headerContent.breadcrumb}
                className="min-w-0 overflow-hidden whitespace-nowrap"
              />
            ) : null}
            <h1 className="truncate text-sm font-semibold text-foreground">{headerContent.title}</h1>
            {headerContent.description ? (
              <p className="truncate text-xs text-muted-foreground">{headerContent.description}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <NotificationBell />
    </header>
  )
}
