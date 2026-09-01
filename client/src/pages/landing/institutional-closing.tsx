import { Link } from '@tanstack/react-router'
import heroBg from '@/assets/Kantor_Gubernur_Sumbar_belakang.jpg'
import { ROUTES } from '@/utils/constants'

interface InstitutionalClosingProps {
  governmentName: string
  officeName: string
}

export function InstitutionalClosing({ governmentName, officeName }: InstitutionalClosingProps) {
  return (
    <section className="bg-surface px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative mx-auto min-h-[470px] max-w-7xl overflow-hidden rounded-[32px] bg-[#0a2a5f] text-white shadow-[0_34px_90px_-54px_rgba(2,6,23,0.5)]">
        <img
          src={heroBg}
          alt="Kantor Gubernur Sumatera Barat"
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-center opacity-55 lg:w-[62%]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0a2a5f_0%,#0a2a5f_42%,rgba(10,42,95,0.86)_62%,rgba(10,42,95,0.22)_100%)]" aria-hidden />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.22),transparent_48%)]" aria-hidden />

        <div className="relative flex min-h-[470px] max-w-2xl flex-col justify-center px-7 py-16 sm:px-10 lg:px-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{governmentName} · {officeName}</p>
          <h2 className="mt-5 text-[clamp(2.8rem,5vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
            Akses ruang kerja pengelolaan SOP.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-200">
            Masuk ke sistem untuk mengakses tugas dan dokumen sesuai peran serta kewenangan pengguna.
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
