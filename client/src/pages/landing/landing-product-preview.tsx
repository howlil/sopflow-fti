import { FileCheck2, ShieldCheck } from 'lucide-react'

const lifecycle = ['Draft', 'Review Proses', 'Persetujuan', 'TTE', 'Berlaku']

export function LandingProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl" aria-label="Pratinjau ruang kerja SOPFlow FTI">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-2 shadow-[0_36px_90px_-52px_rgba(15,23,42,0.38)] sm:p-3">
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-surface">
          <div className="flex flex-col gap-3 border-b border-border bg-surface-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Review Proses Bisnis</p>
              <p className="mt-1 text-base font-semibold tracking-[-0.02em] text-foreground">Contoh SOP FTI</p>
            </div>
            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-secondary-foreground shadow-[0_8px_22px_-20px_rgba(15,23,42,0.45)]">
              Pratinjau sistem
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.28fr_0.72fr]">
            <div className="border-b border-border bg-[#f8fbff] p-5 lg:border-b-0 lg:border-r lg:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lifecycle</p>
              <ol className="mt-5 space-y-4">
                {lifecycle.map((item, index) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className={index < 2 ? 'h-2 w-2 rounded-full bg-primary' : 'h-2 w-2 rounded-full border border-border-strong bg-surface'} />
                    <span className={index < 2 ? 'text-xs font-medium text-foreground' : 'text-xs text-muted-foreground'}>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-5 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-3 border-b border-row-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">SOP Layanan Akademik</p>
                  <p className="mt-1 text-xs text-muted-foreground">Process Owner mereview substansi dan kelengkapan dokumen</p>
                </div>
                <span className="w-fit rounded-full bg-warning-subtle px-3 py-1.5 text-[10px] font-semibold text-warning-foreground">
                  Menunggu persetujuan akhir
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.42)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <FileCheck2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Catatan review
                  </div>
                  <p className="mt-3 text-xs leading-5 text-secondary-foreground">Catatan perbaikan tetap melekat pada versi SOP dan Process yang direview.</p>
                </div>
                <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.42)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Kewenangan kontekstual
                  </div>
                  <p className="mt-3 text-xs leading-5 text-secondary-foreground">Persetujuan akhir dan TTE diarahkan ke Dekan atau Ketua Jurusan sesuai lingkup Process.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
