interface PreviewFrameProps {
  eyebrow: string
  title: string
  rows: ReadonlyArray<readonly [string, string]>
}

export type WorkflowPreviewKind = 'authoring' | 'evaluation' | 'approval'

const previewSurfaceClass = 'rounded-[24px] border border-slate-200/80 bg-surface p-5 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.34)] sm:p-7'

function PreviewFrame({ eyebrow, title, rows }: PreviewFrameProps) {
  return (
    <div className={previewSurfaceClass}>
      <div className="flex items-start justify-between gap-5 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Ilustrasi struktur informasi pada sistem.</p>
        </div>
        <span className="rounded-full border border-blue-200 bg-primary-subtle px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-info-foreground">
          Draft kerja
        </span>
      </div>
      <div className="mt-4 divide-y divide-row-border border-y border-row-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-5 py-3">
            <span className="text-sm text-secondary-foreground">{label}</span>
            <span className="text-xs font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvaluationRow({ label, status }: { label: string; status: 'Sesuai' | 'Perlu perbaikan' }) {
  return (
    <div className="flex items-center justify-between gap-5 py-3">
      <span className="text-sm text-secondary-foreground">{label}</span>
      <span className={status === 'Sesuai' ? 'text-xs font-semibold text-success' : 'text-xs font-semibold text-warning'}>
        {status}
      </span>
    </div>
  )
}

export function AuthoringPreview() {
  const rows = [
    ['Identitas SOP', 'Lengkap'],
    ['Pelaksana', 'Terdefinisi'],
    ['Prosedur', 'Terstruktur'],
    ['Peraturan', 'Terkait'],
  ] as const

  return <PreviewFrame eyebrow="Workspace penyusunan" title="SOP Pelayanan Administrasi" rows={rows} />
}

export function EvaluationPreview() {
  return (
    <div className={previewSurfaceClass}>
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Evaluasi</p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">SOP Pelayanan Administrasi</h3>
        <p className="mt-1 text-xs text-muted-foreground">Penilaian dan catatan tetap terhubung ke dokumen yang sama.</p>
      </div>
      <div className="mt-4 divide-y divide-row-border border-y border-row-border">
        <EvaluationRow label="Kelengkapan dokumen" status="Sesuai" />
        <EvaluationRow label="Urutan prosedur" status="Perlu perbaikan" />
        <EvaluationRow label="Kejelasan pelaksana" status="Sesuai" />
      </div>
      <div className="mt-5 rounded-[14px] border-l-2 border-warning bg-warning-subtle px-4 py-3">
        <p className="text-xs font-semibold text-warning-foreground">Catatan evaluator</p>
        <p className="mt-1 text-sm leading-6 text-secondary-foreground">
          Perbaiki keterkaitan langkah persetujuan dengan pelaksana yang bertanggung jawab.
        </p>
      </div>
    </div>
  )
}

export function ApprovalArchivePreview() {
  const events = ['Evaluasi selesai', 'Berita acara siap', 'Pengesahan internal', 'Arsip berlaku'] as const

  return (
    <div className={previewSurfaceClass}>
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Penyelesaian dokumen</p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">SOP siap menuju status berlaku</h3>
      </div>
      <ol className="mt-4 divide-y divide-row-border">
        {events.map((event, index) => (
          <li key={event} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3 text-sm">
            <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
            <span className="text-secondary-foreground">{event}</span>
            <span className={index < 2 ? 'text-xs font-semibold text-success' : 'text-xs text-muted-foreground'}>
              {index < 2 ? 'Selesai' : 'Berikutnya'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function WorkflowPreview({ preview }: { preview: WorkflowPreviewKind }) {
  switch (preview) {
    case 'authoring':
      return <AuthoringPreview />
    case 'evaluation':
      return <EvaluationPreview />
    case 'approval':
      return <ApprovalArchivePreview />
  }
}
