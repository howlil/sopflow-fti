import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Network,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react'
import { useAdministrasiFtiOverview } from '@/api/administrasi-fti'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/utils/constants'

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  to,
}: {
  label: string
  value: number
  detail: string
  icon: typeof Users
  to: string
}) {
  return (
    <Link
      to={to}
      className="group rounded-surface border border-border bg-surface p-4 shadow-surface transition-colors hover:border-primary/40 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-control bg-primary-subtle p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <ArrowRight
          className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-secondary-foreground">{detail}</p>
    </Link>
  )
}

function LoadingDashboard() {
  return (
    <div className="space-y-4" aria-label="Memuat ringkasan administrasi">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  useDocumentTitle('Administrasi FTI')
  const { data: overview, isLoading, isError, refetch } = useAdministrasiFtiOverview()

  if (isLoading) return <LoadingDashboard />

  if (isError || overview === undefined) {
    return (
      <ListPageLayout breadcrumb={[{ label: 'Administrasi' }]} title="Administrasi FTI">
        <DataSurface.Root>
          <div className="flex flex-col items-start gap-3 p-5">
            <div className="rounded-control bg-danger-subtle p-2 text-danger">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Ringkasan administrasi belum tersedia
              </h2>
              <p className="mt-1 text-sm text-secondary-foreground">
                Data dashboard gagal dimuat. Coba ulangi sebelum mengubah konfigurasi.
              </p>
            </div>
            <Button variant="outline" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          </div>
        </DataSurface.Root>
      </ListPageLayout>
    )
  }

  const attentionItems = [
    ...(!overview.finalApproval.deanConfigured
      ? [
          {
            label: 'Dean belum ditetapkan',
            detail: 'Proses Bisnis lingkup Fakultas belum memiliki pejabat persetujuan akhir.',
            to: ROUTES.ADMIN.AUTHORITIES,
          },
        ]
      : []),
    ...(overview.finalApproval.departmentsWithoutHead.length > 0
      ? [
          {
            label: `${overview.finalApproval.departmentsWithoutHead.length} Departemen belum punya Kepala`,
            detail: 'Tetapkan Kepala Departemen agar approval dapat berjalan.',
            to: ROUTES.ADMIN.AUTHORITIES,
          },
        ]
      : []),
    ...(overview.ownerGovernance.activeAssignments === 0
      ? [
          {
            label: 'Belum ada Penanggung Jawab Proses Bisnis',
            detail: 'Berikan kewenangan lingkup kepada pengguna yang akan membuat Proses Bisnis.',
            to: ROUTES.ADMIN.PROCESSES,
          },
        ]
      : []),
  ]

  return (
    <ListPageLayout breadcrumb={[{ label: 'Administrasi' }]} title="Administrasi FTI">
      <section className="flex flex-col gap-4 rounded-surface border border-border bg-surface p-5 shadow-surface sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Administrasi FTI</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary-foreground">
            Kelola akun, Departemen, Owner Proses Bisnis, dan pejabat persetujuan.
          </p>
        </div>
        <Badge variant="success" className="w-fit">
          Platform Admin
        </Badge>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Akun aktif"
          value={overview.accounts.active}
          detail={`${overview.accounts.inactive} nonaktif · ${overview.accounts.total} total`}
          icon={Users}
          to={ROUTES.ADMIN.ACCOUNTS}
        />
        <MetricCard
          label="Departemen"
          value={overview.organization.departemen}
          detail="Struktur organisasi FTI"
          icon={Building2}
          to={ROUTES.ADMIN.PROCESSES}
        />
        <MetricCard
          label="Proses Bisnis"
          value={overview.organization.prosesBisnis}
          detail={`${overview.organization.facultyProcesses} Fakultas · ${overview.organization.departmentProcesses} Departemen`}
          icon={Network}
          to={ROUTES.ADMIN.PROCESSES}
        />
        <MetricCard
          label="Kewenangan Owner"
          value={overview.ownerGovernance.activeAssignments}
          detail={`${overview.accounts.workflowUsers} pengguna dengan kewenangan Owner aktif`}
          icon={Workflow}
          to={ROUTES.ADMIN.PROCESSES}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <DataSurface.Root>
          <DataSurface.Header>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Perlu perhatian</h2>
                <p className="mt-1 text-sm text-secondary-foreground">
                  Pengaturan yang perlu dilengkapi sebelum SOP diproses.
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            </div>
          </DataSurface.Header>
          {attentionItems.length === 0 ? (
            <div className="flex items-start gap-3 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Konfigurasi inti siap</p>
                <p className="mt-1 text-sm text-secondary-foreground">
                  Tidak ada pengaturan wajib yang terdeteksi belum lengkap.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attentionItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-start justify-between gap-4 p-4 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-secondary-foreground">{item.detail}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              ))}
            </div>
          )}
        </DataSurface.Root>

        <DataSurface.Root>
          <DataSurface.Header>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Aksi utama</h2>
              <p className="mt-1 text-sm text-secondary-foreground">
                Buka area sesuai pekerjaan Admin.
              </p>
            </div>
          </DataSurface.Header>
          <div className="grid gap-2 p-4">
            <Button asChild className="justify-between">
              <Link to={ROUTES.ADMIN.ACCOUNTS}>
                Kelola akun FTI
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to={ROUTES.ADMIN.PROCESSES}>
                Kelola Proses Bisnis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to={ROUTES.ADMIN.AUTHORITIES}>
                Atur kewenangan approval
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </DataSurface.Root>
      </div>
    </ListPageLayout>
  )
}
