import { Archive, Asterisk, ClipboardCheck, FileText, Stamp } from 'lucide-react'

const workflowSteps = ['Penyusunan', 'Evaluasi', 'Pengesahan', 'Arsip']
const workflowIcons = [FileText, ClipboardCheck, Stamp, Archive]

export function LoginHero() {
  return (
    <aside
      className="relative min-h-[420px] overflow-hidden px-6 py-8 text-white sm:min-h-[480px] sm:px-8 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12 xl:px-16 xl:py-14"
      style={{
        backgroundImage:
          'radial-gradient(circle at 78% 12%, rgba(219,234,254,0.9) 0%, rgba(219,234,254,0) 34%), radial-gradient(circle at 72% 58%, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0) 38%), linear-gradient(145deg, #60a5fa 0%, #2563eb 42%, #1d4ed8 68%, #0f3a9a 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 58% 62%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 46%)',
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col">
        <div className="grid h-11 w-11 place-items-center" aria-hidden>
          <Asterisk className="h-10 w-10 text-white" strokeWidth={2.35} />
        </div>

        <div className="mt-auto pt-16 sm:pt-24 lg:pt-20">
          <p className="text-xs font-medium text-white/80">Portal Internal SOP</p>
          <h1 className="mt-3 max-w-[470px] text-[30px] font-semibold leading-[1.12] tracking-[-0.035em] text-white sm:text-[36px] lg:text-[38px]">
            Kelola SOP secara terstruktur dari penyusunan hingga arsip
          </h1>
          <p className="mt-4 max-w-md text-xs leading-5 text-white/75 sm:text-sm">
            Biro Organisasi · Pemerintah Provinsi Sumatera Barat
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-2 lg:mt-10">
            {workflowSteps.map((step, index) => {
              const Icon = workflowIcons[index]

              return (
                <div key={step} className="min-w-0">
                  <div className="flex items-center">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/45 bg-white/10">
                      <Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden />
                    </span>
                    {index < workflowSteps.length - 1 ? (
                      <span className="ml-2 hidden h-px flex-1 border-t border-dashed border-white/35 sm:block" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-[11px] font-medium text-white/90 sm:text-[10px] lg:text-[11px]">
                    {step}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
