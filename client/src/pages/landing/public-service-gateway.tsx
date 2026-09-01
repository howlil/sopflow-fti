import { Link } from '@tanstack/react-router'
import { Archive, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

const services = [
  {
    title: 'Arsip SOP',
    description: 'Cari SOP yang telah dipublikasikan berdasarkan OPD atau informasi dokumen.',
    action: 'Buka Arsip',
    to: ROUTES.ARSIP.PREFIX,
    icon: Archive,
    detail: 'Dokumen publik',
  },
  {
    title: 'Validasi PDF',
    description: 'Periksa validitas dokumen PDF yang dihasilkan oleh sistem.',
    action: 'Validasi PDF',
    to: ROUTES.VALIDASI.PDF,
    icon: ShieldCheck,
    detail: 'Verifikasi dokumen',
  },
] as const

export function PublicServiceGateway() {
  return (
    <section aria-labelledby="public-services-title" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Layanan publik</p>
          <h2 id="public-services-title" className="mt-4 text-[clamp(2.35rem,4.4vw,3.7rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground">
            Arsip dan validasi SOP.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-secondary-foreground sm:text-base sm:leading-7">
            Arsip SOP dan validasi PDF dapat diakses tanpa masuk ke ruang kerja pengguna.
          </p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_30px_80px_-52px_rgba(15,23,42,0.32)] lg:grid-cols-2">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Link
                key={service.title}
                to={service.to}
                className={`group flex min-h-[300px] flex-col justify-between p-7 transition-colors hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-9 ${index === 0 ? 'border-b border-slate-200/80 lg:border-b-0 lg:border-r' : ''}`}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-primary-subtle text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary motion-reduce:transition-none" aria-hidden />
                </div>

                <div className="mt-12 max-w-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{service.detail}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">{service.title}</h3>
                  <p className="mt-4 text-base leading-7 text-secondary-foreground">{service.description}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {service.action}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
