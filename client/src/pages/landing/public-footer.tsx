import logoSvg from '@/assets/logo.svg'
import { APP_DISPLAY_NAME } from '@/config/env'

interface PublicFooterProps {
  institutionName: string
  productName: string
}

export function PublicFooter({ institutionName, productName }: PublicFooterProps) {
  return (
    <footer className="border-t border-border bg-surface-muted text-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div className="flex max-w-xl items-start gap-3">
          <img src={logoSvg} alt={APP_DISPLAY_NAME} className="h-9 w-9 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{APP_DISPLAY_NAME}</p>
            <p className="mt-1 text-xs leading-5 text-secondary-foreground">{institutionName} · {productName}</p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-secondary-foreground">
              Sistem siklus SOP berbasis Proses Bisnis, kewenangan organisasi, dan tanda tangan elektronik.
            </p>
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {institutionName}</p>
        </div>
      </div>
    </footer>
  )
}
