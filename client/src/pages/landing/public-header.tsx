import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { APP_DISPLAY_NAME } from '@/config/env'
import { ROUTES } from '@/utils/constants'

interface PublicHeaderProps {
  institutionName: string
  productName: string
}

export function PublicHeader({ institutionName, productName }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to={ROUTES.HOME}
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img src={logoSvg} alt={APP_DISPLAY_NAME} className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">{APP_DISPLAY_NAME}</p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{institutionName} · {productName}</p>
          </div>
        </Link>

        <div className="flex items-center gap-5">
          <nav className="hidden items-center gap-7 text-sm font-medium text-secondary-foreground md:flex" aria-label="Navigasi publik">
            <Link to={ROUTES.ARSIP.PREFIX} className="transition-colors hover:text-foreground">Arsip SOP</Link>
            <Link to={ROUTES.VALIDASI.PDF} className="transition-colors hover:text-foreground">Validasi PDF</Link>
          </nav>
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="inline-flex h-10 items-center justify-center gap-2 px-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Masuk
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}
