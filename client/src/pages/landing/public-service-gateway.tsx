import { Link } from '@tanstack/react-router'
import { Archive, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

const services = [
  {
    title: 'Arsip SOP',
    description: 'Cari SOP yang sudah berlaku pada arsip publik berdasarkan Proses Bisnis.',
    action: 'Buka arsip',
    to: ROUTES.ARSIP.PREFIX,
    icon: Archive,
  },
  {
    title: 'Validasi PDF',
    description: 'Periksa PDF yang diterbitkan sistem melalui layanan validasi publik.',
    action: 'Mulai validasi',
    to: ROUTES.VALIDASI.PDF,
    icon: ShieldCheck,
  },
] as const

export function PublicServiceGateway() {
  return (
    <section aria-labelledby="public-services-title" className="border-b border-border bg-surface-muted py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="public-services-title" className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              Temukan dan periksa dokumen SOP.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-secondary-foreground">
            Arsip SOP dan validasi PDF tersedia tanpa masuk ke ruang kerja pengguna.
          </p>
        </div>

        <div className="mt-6 grid border border-border bg-surface sm:grid-cols-2">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <Link
                key={service.title}
                to={service.to}
                className={`group flex min-h-[188px] flex-col justify-between p-5 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-6 ${index === 0 ? 'border-b border-border sm:border-b-0 sm:border-r' : ''}`}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className="grid h-10 w-10 place-items-center border border-border bg-primary-subtle text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary motion-reduce:transition-none" aria-hidden />
                </div>

                <div className="mt-8 max-w-xl">
                  <h3 className="text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary-foreground">{service.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
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
