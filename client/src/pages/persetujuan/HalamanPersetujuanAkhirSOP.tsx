import { Eye, FileSignature, Workflow } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useProsesBisnisLifecycle } from '@/api/persetujuan-akhir-sop'
import { useMyOrganizationalAuthorities } from '@/api/pejabat-berwenang'
import { ExpandableGroupedTable } from '@/components/data/expandable-grouped-table'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/ui/query-state'
import { Table } from '@/components/ui/data-table'
import { getSopStatusLabel } from '@/lib/status/sop-status.config'
import type { ProsesBisnisLifecycleGroupDto, ProsesBisnisLifecycleSopDto } from '@/types/dto/persetujuan.dto'
import { ROUTES } from '@/utils/constants'

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'EFFECTIVE') return 'success'
  if (status === 'REVOKED') return 'destructive'
  if (status === 'TTE_PENDING') return 'warning'
  return 'secondary'
}

function authorityLabel(group: ProsesBisnisLifecycleGroupDto) {
  return group.lingkup === 'FACULTY'
    ? 'Fakultas · Dekan'
    : `${group.departmentNama ?? 'Departemen'} · Kepala Departemen`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

function renderSopRows(group: ProsesBisnisLifecycleGroupDto) {
  return (
    <>
      <thead>
        <Table.HeadRow>
          <Table.Th>SOP</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th className="hidden lg:table-cell">Tahap / pihak berwenang</Table.Th>
          <Table.Th className="hidden sm:table-cell">Diperbarui</Table.Th>
          <Table.ActionTh>Aksi</Table.ActionTh>
        </Table.HeadRow>
      </thead>
      <tbody>
        {group.sops.length === 0 ? (
          <Table.BodyRow>
            <Table.Td colSpan={5}>
              <span className="text-sm text-muted-foreground">Belum ada SOP pada Proses Bisnis ini.</span>
            </Table.Td>
          </Table.BodyRow>
        ) : group.sops.map((sop: ProsesBisnisLifecycleSopDto) => (
          <Table.BodyRow key={sop.detailSopId}>
            <Table.Td>
              <p className="font-medium text-foreground">{sop.judul}</p>
              <p className="text-xs text-secondary-foreground">{sop.nomorSOP} · v{sop.versi}</p>
            </Table.Td>
            <Table.Td>
              <Badge variant={statusVariant(sop.status)}>{sop.statusLabel}</Badge>
            </Table.Td>
            <Table.Td className="hidden lg:table-cell">
              <p className="text-sm text-foreground">{sop.siklus.stateLabel}</p>
              <p className="text-xs text-secondary-foreground">
                {sop.siklus.responsibility.name ?? 'Tidak ada penanggung jawab aktif'}
              </p>
            </Table.Td>
            <Table.Td className="hidden text-xs text-secondary-foreground sm:table-cell">
              {formatDate(sop.updatedAt)}
            </Table.Td>
            <Table.ActionTd>
              <div className="flex items-center gap-1">
                <Link
                  to={ROUTES.DETAIL_SOP}
                  params={{ id: sop.detailSopId }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium text-secondary-foreground hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Lihat SOP"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">Lihat</span>
                </Link>
                {sop.siklus.action?.type === 'SIGN_TTE' ? (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link to={ROUTES.TTE.INBOX}>
                      <FileSignature className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">TTE</span>
                    </Link>
                  </Button>
                ) : null}
              </div>
            </Table.ActionTd>
          </Table.BodyRow>
        ))}
      </tbody>
    </>
  )
}

export function HalamanPersetujuanAkhirSOP() {
  const lifecycle = useProsesBisnisLifecycle()
  const { data: authorities = [] } = useMyOrganizationalAuthorities()
  const authorityCount = authorities.length

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'SOP' }, { label: 'Siklus SOP' }]}
      title="Siklus SOP"
      description="Pantau siklus seluruh SOP dalam lingkup kewenangan Anda. SOP yang disetujui hasil pemeriksaannya langsung menunggu Tanda Tangan Elektronik."
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Proses Bisnis dalam lingkup kewenangan Anda</h2>
                <p className="text-xs text-secondary-foreground">{lifecycle.groups.length} Proses Bisnis dan {authorityCount} assignment pejabat aktif</p>
              </div>
            </div>
            <Button asChild size="sm" className="gap-1.5">
              <Link to={ROUTES.TTE.INBOX}>
                <FileSignature className="h-4 w-4" aria-hidden />
                Ruang Tanda Tangan Elektronik
              </Link>
            </Button>
          </div>
        </DataSurface.Header>
        <QueryState isLoading={lifecycle.isLoading} isError={lifecycle.isError} onRetry={() => void lifecycle.refetch()}>
          <ExpandableGroupedTable
            groups={lifecycle.groups}
            getGroupId={(group) => group.prosesBisnisId}
            surfaceMode="embedded"
            emptyContent={
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-foreground">Belum ada Proses Bisnis dalam lingkup kewenangan Anda</p>
                <p className="mt-1 text-sm text-muted-foreground">Penetapan Pejabat Penandatangan menentukan daftar ini.</p>
              </div>
            }
            renderGroupTitle={(group) => group.namaProsesBisnis}
            renderGroupMeta={(group) => `${group.jumlahSop} SOP`}
            renderGroupAside={(group) => (
              <span>{authorityLabel(group)} · {Object.entries(group.statusCounts).map(([status, count]) => `${getSopStatusLabel(status)}: ${count}`).join(' · ') || 'Belum ada SOP'}</span>
            )}
            renderRows={renderSopRows}
          />
        </QueryState>
      </DataSurface.Root>
    </ListPageLayout>
  )
}
