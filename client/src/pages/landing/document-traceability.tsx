import { CheckCircle2, FileSearch, ShieldCheck } from 'lucide-react'

const validationRows = [
  ['Nomor dokumen', 'SOP-OPD-2026-014'],
  ['Status arsip', 'Berlaku'],
  ['Validasi PDF', 'Valid'],
]

export function DocumentTraceability() {
  return (
    <section className="bg-[#f8fbff] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_32px_84px_-54px_rgba(15,23,42,0.34)] lg:grid-cols-[0.38fr_0.62fr]">
          <div className="bg-[#f3f8ff] p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Arsip publik dan validasi</p>
            <h2 className="mt-4 text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-slate-950">
              Arsip dan validasi dokumen dalam satu tempat.
            </h2>
            <p className="mt-5 text-base leading-7 text-secondary-foreground">
              Publik dapat menelusuri SOP yang sudah berlaku, sementara dokumen pengesahan dapat diperiksa melalui halaman validasi PDF tanpa membuka ruang kerja internal.
            </p>
            <p className="mt-8 flex items-center gap-2 text-xs leading-5 text-secondary-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              Satu dokumen. Satu riwayat yang dapat ditelusuri.
            </p>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="p-7 sm:p-9 lg:border-r lg:border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <FileSearch className="h-4 w-4" aria-hidden />
                Pencarian arsip
              </div>
              <div className="mt-7 rounded-[18px] bg-surface-subtle p-5">
                <p className="text-sm font-semibold text-foreground">SOP Pelayanan Administrasi</p>
                <p className="mt-1 text-xs text-muted-foreground">Dinas Kesehatan Provinsi</p>
                <div className="mt-5 flex items-center justify-between border-t border-row-border pt-4">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="rounded-full bg-success-subtle px-3 py-1 text-[10px] font-semibold text-success">Berlaku</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/80 p-7 sm:p-9 lg:border-t-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Hasil validasi
              </div>
              <div className="mt-7 divide-y divide-row-border border-y border-row-border">
                {validationRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-4">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">Hasil validasi ditampilkan tanpa membuka data ruang kerja internal.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
