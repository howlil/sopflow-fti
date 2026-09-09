import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'

export function IdentityHero() {
  return (
    <section
      aria-labelledby="landing-hero-title"
      className="border-b border-border bg-surface text-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div data-testid="landing-hero-copy" className="max-w-3xl">
          <h1 id="landing-hero-title" className="max-w-3xl text-[clamp(2.5rem,6vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
            Siklus SOP FTI dari penyusunan hingga berlaku.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary-foreground sm:text-lg">
            Kelola penyusunan, tinjauan Proses Bisnis, persetujuan akhir, TTE, dan publikasi SOP FTI dalam satu alur yang jelas.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex h-10 items-center justify-center rounded-control border border-border-strong bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Masuk ke Sistem
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
