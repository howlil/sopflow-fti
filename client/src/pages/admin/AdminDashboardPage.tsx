import { Link } from '@tanstack/react-router'
import { useAdministrasiFtiOverview } from '@/api/administrasi-fti'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/data-table'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { ROUTES } from '@/utils/constants'

type AttentionRow = {
  issue: string
  scope: string
  impact: string
  to: string
}

export function AdminDashboardPage() {
  useDocumentTitle('Administrasi Sistem')
  const { data: overview, isLoading, isError, refetch } = useAdministrasiFtiOverview()

  const rows: AttentionRow[] = overview ? [
    ...(!overview.finalApproval.deanConfigured ? [{
      issue: 'Dekan belum ditetapkan',
      scope: 'Fakultas Teknologi Informasi',
      impact: 'SOP lingkup Fakultas tidak dapat disahkan atau ditandatangani.',
      to: ROUTES.ADMIN.AUTHORITIES,
    }] : []),
    ...overview.finalApproval.departmentsWithoutHead.map((department) => ({
      issue: 'Kepala Departemen belum ditetapkan',
      scope: department.nama,
      impact: 'SOP lingkup Departemen tidak dapat disahkan atau ditandatangani.',
      to: ROUTES.ADMIN.AUTHORITIES,
    })),
    ...(overview.ownerGovernance.activeAssignments === 0 ? [{
      issue: 'Belum ada kewenangan Penanggung Jawab',
      scope: 'Proses Bisnis FTI',
      impact: 'Belum ada pengguna yang dapat membentuk Proses Bisnis.',
      to: ROUTES.ADMIN.PROCESSES,
    }] : []),
  ] : []

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Administrasi Sistem' }]}
      title="Administrasi Sistem"
      description="Lengkapi konfigurasi yang menjadi prasyarat workflow SOP. Navigasi pengelolaan tersedia langsung di sidebar."
    >
      {isError ? (
        <div className="flex items-center justify-between gap-4 border-y border-border py-4">
          <p className="text-sm text-secondary-foreground">Konfigurasi administrasi gagal dimuat.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>Coba lagi</Button>
        </div>
      ) : (
        <section className="space-y-3" aria-labelledby="attention-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="attention-title" className="text-sm font-semibold text-foreground">Konfigurasi yang perlu dilengkapi</h2>
              <p className="mt-1 text-sm text-secondary-foreground">Hanya menampilkan kondisi yang dapat menghambat proses SOP.</p>
            </div>
            {!isLoading && rows.length === 0 ? <Badge variant="success">Konfigurasi inti siap</Badge> : null}
          </div>

          <Table.Card>
            <Table.Root aria-label="Konfigurasi administrasi yang perlu dilengkapi">
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>Masalah</Table.Th>
                    <Table.Th>Lingkup</Table.Th>
                    <Table.Th>Dampak</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {isLoading ? (
                    <Table.BodyRow><Table.Td colSpan={4}>Memuat konfigurasi...</Table.Td></Table.BodyRow>
                  ) : rows.length === 0 ? (
                    <Table.BodyRow><Table.Td colSpan={4}>Tidak ada konfigurasi wajib yang terdeteksi belum lengkap.</Table.Td></Table.BodyRow>
                  ) : rows.map((row) => (
                    <Table.BodyRow key={`${row.issue}-${row.scope}`}>
                      <Table.Td className="font-medium">{row.issue}</Table.Td>
                      <Table.Td>{row.scope}</Table.Td>
                      <Table.Td className="max-w-xl text-secondary-foreground">{row.impact}</Table.Td>
                      <Table.ActionTd>
                        <Button asChild size="sm" variant="outline">
                          <Link to={row.to}>Atur</Link>
                        </Button>
                      </Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </Table.Root>
          </Table.Card>
        </section>
      )}
    </ListPageLayout>
  )
}
