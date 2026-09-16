import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, FileCheck2, Search } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { usePaketPemeriksaanProsesBisnis } from '@/api/pemeriksaan-proses-bisnis'
import { DataSurface } from '@/components/data/data-surface'
import { ListPageLayout } from '@/components/layout/ListPageLayout'
import { Badge } from '@/components/ui/badge'
import { QueryState } from '@/components/ui/query-state'
import { Table } from '@/components/ui/data-table'
import type { PaketPemeriksaanProsesBisnisDto } from '@/types/dto/persetujuan.dto'
import { ROUTES } from '@/utils/constants'

function packageStatusLabel(status: PaketPemeriksaanProsesBisnisDto['status']) {
  if (status === 'COMPLETED') return 'Selesai diperiksa'
  if (status === 'PARTIALLY_COMPLETED') return 'Sebagian selesai'
  return 'Dalam pemeriksaan'
}

function packageStatusVariant(status: PaketPemeriksaanProsesBisnisDto['status']) {
  return status === 'COMPLETED' ? 'success' : status === 'PARTIALLY_COMPLETED' ? 'warning' : 'secondary'
}

function itemStatusVariant(status: string) {
  if (status === 'TTE_PENDING') return 'success'
  if (status === 'REVISION_REQUIRED') return 'destructive'
  return status === 'PROCESS_REVIEW' ? 'warning' : 'secondary'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function HalamanPemeriksaanProsesBisnis() {
  const { packages, isLoading, isError, refetch } = usePaketPemeriksaanProsesBisnis()
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (id: string) => {
    setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'SOP' }, { label: 'Pemeriksaan SOP' }]}
      title="Pemeriksaan SOP"
      description="Periksa SOP yang diajukan dalam satu paket. Keputusan, catatan, dan bukti pemeriksaan tetap dicatat per SOP."
    >
      <DataSurface.Root>
        <DataSurface.Header>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Paket Pemeriksaan Proses Bisnis</h2>
              <p className="text-xs text-secondary-foreground">{packages.length} paket pengajuan</p>
            </div>
          </div>
        </DataSurface.Header>
        <QueryState isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
          {packages.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-foreground">Belum ada SOP yang diajukan untuk pemeriksaan</p>
              <p className="mt-1 text-sm text-muted-foreground">Pengajuan dari Tim Penyusun SOP akan muncul sebagai satu paket Proses Bisnis.</p>
            </div>
          ) : (
            <Table.Root>
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th className="w-10"><span className="sr-only">Buka paket</span></Table.Th>
                    <Table.Th>Proses Bisnis</Table.Th>
                    <Table.Th>Pengajuan</Table.Th>
                    <Table.Th>Progres</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {packages.map((paket) => {
                    const isOpen = expanded.includes(paket.paketPemeriksaanProsesBisnisId)
                    return (
                      <FragmentRows
                        key={paket.paketPemeriksaanProsesBisnisId}
                        paket={paket}
                        isOpen={isOpen}
                        onToggle={() => toggle(paket.paketPemeriksaanProsesBisnisId)}
                      />
                    )
                  })}
                </tbody>
              </Table.Table>
            </Table.Root>
          )}
        </QueryState>
      </DataSurface.Root>
    </ListPageLayout>
  )
}

function FragmentRows({
  paket,
  isOpen,
  onToggle,
}: {
  paket: PaketPemeriksaanProsesBisnisDto
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      <Table.BodyRow>
        <Table.Td>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-control text-secondary-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Tutup' : 'Buka'} paket ${paket.namaProsesBisnis}`}
            onClick={onToggle}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        </Table.Td>
        <Table.Td>
          <p className="font-medium text-foreground">{paket.namaProsesBisnis}</p>
          <p className="text-xs text-secondary-foreground">Paket Pemeriksaan Proses Bisnis</p>
        </Table.Td>
        <Table.Td className="text-xs text-secondary-foreground">{formatDate(paket.diajukanPada)}</Table.Td>
        <Table.Td>
          <p className="font-medium text-foreground">{paket.totalSop - paket.menungguPemeriksaan} dari {paket.totalSop} selesai</p>
          <p className="text-xs text-secondary-foreground">{paket.menungguPemeriksaan} menunggu pemeriksaan</p>
        </Table.Td>
        <Table.Td><Badge variant={packageStatusVariant(paket.status)}>{packageStatusLabel(paket.status)}</Badge></Table.Td>
      </Table.BodyRow>
      {isOpen ? (
        <Table.BodyRow>
          <Table.Td colSpan={5} className="bg-surface-subtle/40 p-0">
            <div className="border-t border-border px-4 py-3">
              <Table.Table>
                <thead>
                  <Table.HeadRow>
                    <Table.Th>SOP</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th className="hidden md:table-cell">Catatan pemeriksaan</Table.Th>
                    <Table.ActionTh>Aksi</Table.ActionTh>
                  </Table.HeadRow>
                </thead>
                <tbody>
                  {paket.items.map((item) => (
                    <Table.BodyRow key={item.detailSopId}>
                      <Table.Td>
                        <p className="font-medium text-foreground">{item.judul}</p>
                        <p className="text-xs text-secondary-foreground">{item.nomorSOP} · v{item.versi}</p>
                      </Table.Td>
                      <Table.Td><Badge variant={itemStatusVariant(item.status)}>{item.statusLabel}</Badge></Table.Td>
                      <Table.Td className="hidden max-w-sm md:table-cell">
                        <p className="truncate text-sm text-secondary-foreground" title={item.catatanTerakhir ?? undefined}>{item.catatanTerakhir ?? 'Belum ada catatan'}</p>
                      </Table.Td>
                      <Table.ActionTd>
                        <Link
                          to={ROUTES.DETAIL_SOP}
                          params={{ id: item.detailSopId }}
                          className="inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium text-secondary-foreground hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {item.status === 'PROCESS_REVIEW' ? <Search className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                          <span>{item.status === 'PROCESS_REVIEW' ? 'Periksa' : 'Lihat'}</span>
                        </Link>
                      </Table.ActionTd>
                    </Table.BodyRow>
                  ))}
                </tbody>
              </Table.Table>
            </div>
          </Table.Td>
        </Table.BodyRow>
      ) : null}
    </>
  )
}
