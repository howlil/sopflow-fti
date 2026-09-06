import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/utils/constants'
import { LandingProductPreview } from './landing-product-preview'

export interface HeroLifecycleStage {
  step: string
  title: string
}

interface IdentityHeroProps {
  stages: ReadonlyArray<HeroLifecycleStage>
}

export function IdentityHero({ stages }: IdentityHeroProps) {
  return (
    <section
      aria-label={`SOPFlow memandu ${stages.length} tahapan lifecycle SOP FTI`}
      className="relative overflow-hidden border-b border-border bg-[#f8fbff] text-foreground"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_62%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div data-testid="landing-hero-copy" className="flex max-w-4xl flex-col items-center text-center">
          <p className="rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-primary shadow-[0_10px_30px_-24px_rgba(37,99,235,0.65)]">
            Sistem Lifecycle SOP Fakultas Teknologi Informasi
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(3rem,7vw,5.6rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-slate-950">
            Kelola SOP dari Proses Bisnis sampai TTE dalam satu alur.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-secondary-foreground sm:text-lg sm:leading-8">
            SOPFlow menghubungkan Penyusun SOP, Pemilik Proses, dan pejabat TTE berdasarkan lingkup Fakultas atau Jurusan tanpa role workflow global.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-primary px-5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(29,78,216,0.85)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Masuk ke Sistem
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-14 w-full sm:mt-16">
          <LandingProductPreview />
        </div>
      </div>
    </section>
  )
}
