import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Menu, X } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { usePageHeaderContext } from '@/components/layout/PageHeaderProvider'

interface HeaderBarProps {
  isMobileNavOpen?: boolean
  onMobileNavToggle?: () => void
}

export function HeaderBar({ isMobileNavOpen = false, onMobileNavToggle }: HeaderBarProps) {
  const headerContent = usePageHeaderContext()?.headerContent

  return (
    <header
      data-print-hide
      className="flex min-h-[var(--header-height)] flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2 md:px-5 lg:px-6"
    >
      {onMobileNavToggle ? (
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-secondary-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          aria-label={isMobileNavOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-main-navigation"
          onClick={onMobileNavToggle}
        >
          {isMobileNavOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      ) : null}
      <div suppressHydrationWarning className="min-w-0 flex-1">
        {headerContent?.breadcrumb.length ? (
          <div className="min-w-0">
            <Breadcrumb
              items={headerContent.breadcrumb}
              className="min-w-0 overflow-hidden whitespace-nowrap"
            />
          </div>
        ) : null}
      </div>
      <NotificationBell />
    </header>
  )
}
