import type { LandingRoleId } from './role-workspace-showcase'

const workspaceSurfaceClass = 'rounded-[22px] border border-slate-200/80 bg-surface p-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.3)] sm:p-6'

function WorkspaceHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <span className="w-fit rounded-full border border-slate-200 bg-surface-subtle px-3 py-1.5 text-[10px] font-medium text-secondary-foreground">{meta}</span>
    </div>
  )
}

function StatusRow({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' | 'info' }) {
  const toneClass = {
    neutral: 'text-secondary-foreground',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
  }[tone]

  return (
    <div className="flex items-center justify-between gap-5 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${toneClass}`}>{value}</span>
    </div>
  )
}

function AuthoringWorkspace() {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceHeader eyebrow="Draft SOP" title="SOP Pelayanan Administrasi" meta="Penyusun" />
      <div className="mt-5 grid gap-5 md:grid-cols-[0.58fr_0.42fr]">
        <div className="divide-y divide-row-border border-y border-row-border">
          <StatusRow label="Identitas SOP" value="Lengkap" tone="success" />
          <StatusRow label="Pelaksana" value="Terdefinisi" tone="success" />
          <StatusRow label="Prosedur" value="Sedang disusun" tone="info" />
          <StatusRow label="Peraturan" value="Terkait" />
        </div>
        <div className="rounded-[14px] border-l-2 border-primary bg-primary-subtle p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Riwayat revisi</p>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">Perubahan draft tetap tercatat sebelum diajukan oleh PJ Penyusun.</p>
        </div>
      </div>
    </div>
  )
}

function SubmissionWorkspace() {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceHeader eyebrow="Pengajuan evaluasi" title="Paket SOP OPD" meta="PJ Penyusun" />
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-[14px] border border-slate-200/80 p-4">
          <p className="text-xs font-semibold text-foreground">SOP dalam paket</p>
          <div className="mt-3 divide-y divide-row-border">
            <StatusRow label="SOP Pelayanan Administrasi" value="Siap diajukan" tone="success" />
            <StatusRow label="SOP Pengelolaan Surat" value="Perlu tinjau" tone="warning" />
          </div>
        </div>
        <div className="rounded-[14px] bg-surface-subtle p-4">
          <p className="text-xs font-semibold text-foreground">Tindak lanjut</p>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">PJ Penyusun mengoordinasikan dokumen yang siap dikirim dan perbaikan yang masih harus diselesaikan.</p>
        </div>
      </div>
    </div>
  )
}

function EvaluatorWorkspace() {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceHeader eyebrow="Rubrik penilaian" title="SOP Pelayanan Administrasi" meta="Evaluator" />
      <div className="mt-5 grid gap-5 md:grid-cols-[0.56fr_0.44fr]">
        <div className="divide-y divide-row-border border-y border-row-border">
          <StatusRow label="Kelengkapan dokumen" value="Sesuai" tone="success" />
          <StatusRow label="Urutan prosedur" value="Perlu perbaikan" tone="warning" />
          <StatusRow label="Kejelasan pelaksana" value="Sesuai" tone="success" />
        </div>
        <div className="rounded-[14px] border-l-2 border-warning bg-warning-subtle p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-warning-foreground">Catatan evaluator</p>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">Hubungkan langkah persetujuan dengan pelaksana yang bertanggung jawab sebelum pengajuan berikutnya.</p>
        </div>
      </div>
    </div>
  )
}

function CoordinationWorkspace() {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceHeader eyebrow="Pengajuan lintas OPD" title="Koordinasi evaluasi" meta="PJ Evaluator Organisasi" />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          ['Pengajuan', 'Distribusi evaluasi'],
          ['Tim evaluator', 'Penugasan dan tindak lanjut'],
          ['Berita acara', 'Penyelesaian hasil evaluasi'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-[14px] border-t-2 border-primary bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalWorkspace() {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceHeader eyebrow="Pengesahan internal" title="SOP Pelayanan Administrasi" meta="Kepala OPD" />
      <div className="mt-5 grid gap-5 md:grid-cols-[0.6fr_0.4fr]">
        <div className="divide-y divide-row-border border-y border-row-border">
          <StatusRow label="Evaluasi selesai" value="Selesai" tone="success" />
          <StatusRow label="Berita acara" value="Tersedia" tone="success" />
          <StatusRow label="Pengesahan internal" value="Siap diproses" tone="info" />
        </div>
        <div className="rounded-[14px] bg-surface-subtle p-4">
          <p className="text-xs font-semibold text-foreground">Arsip OPD</p>
          <p className="mt-3 text-sm leading-6 text-secondary-foreground">Setelah pengesahan selesai, dokumen bergerak ke status berlaku dan tersedia sesuai aturan akses arsip.</p>
        </div>
      </div>
    </div>
  )
}

export function RoleWorkspacePreview({ roleId }: { roleId: LandingRoleId }) {
  switch (roleId) {
    case 'penyusun':
      return <AuthoringWorkspace />
    case 'pj-penyusun':
      return <SubmissionWorkspace />
    case 'evaluator':
      return <EvaluatorWorkspace />
    case 'pj-evaluator':
      return <CoordinationWorkspace />
    case 'kepala-opd':
      return <ApprovalWorkspace />
  }
}
