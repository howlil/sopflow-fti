import { Link } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'

interface InstitutionalClosingProps {
  institutionName: string
  productName: string
}

export function InstitutionalClosing({ institutionName, productName }: InstitutionalClosingProps) {
  return (
    <section className="bg-surface px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative mx-auto min-h-[420px] max-w-7xl overflow-hidden rounded-[32px] bg-[#0a2a5f] text-white shadow-[0_34px_90px_-54px_rgba(2,6,23,0.5)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.28),transparent_42%),linear-gradient(135deg,#0a2a5f_0%,#0c3475_58%,#0a2a5f_100%)]" aria-hidden />
        <div className="relative flex min-h-[420px] max-w-2xl flex-col justify-center px-7 py-16 sm:px-10 lg:px-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{institutionName} · {productName}</p>
          <h2 className="mt-5 text-[clamp(2.8rem,5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
            Lanjutkan pekerjaan pada Proses Bisnis Anda.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-200">
            Masuk untuk menyusun, mereview, menyetujui, atau menandatangani SOP sesuai hubungan Process dan kewenangan organisasi Anda.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              to={ROUTES.AUTH.LOGIN}
              className="inline-flex h-11 items-center rounded-[11px] bg-white px-5 text-sm font-semibold text-[#0a2a5f] shadow-[0_14px_30px_-20px_rgba(2,6,23,0.7)] transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2a5f]"
            >
              Masuk ke Sistem
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
