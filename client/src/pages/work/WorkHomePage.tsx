import { Link } from '@tanstack/react-router'
import { ArrowRight, ClipboardCheck, FileText, Settings2, ShieldCheck } from 'lucide-react'
import { useMyProsesBisnises } from '@/api/konteks-proses-bisnis'
import { useMyOrganizationalAuthorities } from '@/api/pejabat-berwenang'
import { useProsesBisnisOwnerSelfService } from '@/api/penanggung-jawab-proses-bisnis'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils/constants'

function CapabilityLink({
  to,
  title,
  description,
  icon: Icon,
}: {
  to: string
  title: string
  description: string
  icon: typeof FileText
}) {
  return (
    <li className="flex items-start gap-3 border-b border-border py-4 last:border-b-0">
      <span className="mt-0.5 rounded-control bg-primary-subtle p-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-secondary-foreground">{description}</p>
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5">
        <Link to={to}>
          Buka
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </li>
  )
}

export function WorkHomePage() {
  useDocumentTitle('Beranda Kerja')
  const user = useAuthStore((state) => state.user)
  const { data: processes = [], isLoading: processesLoading } = useMyProsesBisnises()
  const { data: authorities = [], isLoading: authoritiesLoading } = useMyOrganizationalAuthorities()
  const ownerContext = useProsesBisnisOwnerSelfService()
  const canManageProcesses = ownerContext.scopes.length > 0 || ownerContext.prosesBisnis.length > 0
  const isLoading = processesLoading || authoritiesLoading || ownerContext.isLoading
  const hasWork = processes.length > 0 || authorities.length > 0 || canManageProcesses || user?.platformRole === 'SUPER_ADMIN'

  return (
    <ListPageLayout
      title="Beranda Kerja"
      description="Jalur masuk berdasarkan tanggung jawab aktif Anda."
      breadcrumb={null}
    >
      {isLoading ? (
        <p role="status" className="py-8 text-sm text-secondary-foreground">Memuat konteks kerja…</p>
      ) : hasWork ? (
        <ul className="divide-y divide-border border-y border-border">
          {processes.length > 0 ? (
            <CapabilityLink
              to={ROUTES.WORK_QUEUE}
              title="Tugas SOP"
              description="Lanjutkan penyusunan, tinjau revisi, atau lihat pekerjaan yang sedang menunggu pihak lain."
              icon={ClipboardCheck}
            />
          ) : null}
          {processes.length > 0 ? (
            <CapabilityLink
              to={ROUTES.PENYUSUN.SOP}
              title="Semua SOP"
              description="Buka koleksi lengkap SOP pada Proses Bisnis yang dapat Anda akses."
              icon={FileText}
            />
          ) : null}
          {canManageProcesses ? (
            <CapabilityLink
              to={ROUTES.WORK_PROCESSES}
              title="Kelola Proses Bisnis"
              description="Kelola proses dan anggota sesuai kewenangan Penanggung Jawab Proses Bisnis."
              icon={Settings2}
            />
          ) : null}
          {authorities.length > 0 ? (
            <CapabilityLink
              to={ROUTES.APPROVAL.INBOX}
              title="Persetujuan dan TTE"
              description="Periksa dokumen lalu proses persetujuan atau tanda tangan sesuai kewenangan organisasi."
              icon={ShieldCheck}
            />
          ) : null}
          {user?.platformRole === 'SUPER_ADMIN' ? (
            <CapabilityLink
              to={ROUTES.ADMIN.HOME}
              title="Administrasi platform"
              description="Kelola akun, Proses Bisnis, dan kewenangan organisasi FTI."
              icon={Settings2}
            />
          ) : null}
        </ul>
      ) : (
        <EmptyState
          icon={<ClipboardCheck />}
          title="Belum ada tanggung jawab aktif"
          description="Akun Anda sudah aktif, tetapi belum ditugaskan ke Proses Bisnis atau kewenangan organisasi. Hubungi administrator FTI."
        />
      )}
    </ListPageLayout>
  )
}
