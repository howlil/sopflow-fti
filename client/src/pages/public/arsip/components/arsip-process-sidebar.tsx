import type { ReactNode } from 'react'
import { Building2, GraduationCap, Loader2, Workflow } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { PaginationMetaDto } from '@/types/dto/common.dto'
import type { PublicProsesBisnisItem } from '@/types/dto/sop-public.dto'
import { ArsipSearchField } from './arsip-chrome'

export interface ArsipProsesBisnisSidebarProps {
  items: PublicProsesBisnisItem[]
  selectedProsesBisnisId?: string
  processFilter: string
  onProsesBisnisFilterChange: (value: string) => void
  onSelectProsesBisnis: (prosesBisnisId: string) => void
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  pagination?: PaginationMetaDto
  page?: number
  onPageChange?: (page: number) => void
  embedded?: boolean
  compactPagination?: boolean
}

export function ArsipProsesBisnisSidebar({
  items,
  selectedProsesBisnisId,
  processFilter,
  onProsesBisnisFilterChange,
  onSelectProsesBisnis,
  isLoading,
  isError,
  isFetching,
  pagination,
  page = 1,
  onPageChange,
  embedded = false,
  compactPagination = false,
}: ArsipProsesBisnisSidebarProps) {
  const faculty = items.filter((item) => item.lingkup === 'FACULTY')
  const departemen = items.filter((item) => item.lingkup === 'DEPARTMENT')
  const hasFilter = processFilter.trim().length > 0

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col bg-surface',
        !embedded &&
          'max-h-[calc(100vh-12rem)] min-h-[calc(100vh-12rem)] rounded-xl border border-border shadow-surface',
      )}
      aria-label="Daftar Proses Bisnis FTI"
    >
      <div className="border-b border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Konteks FTI
        </p>
        <ArsipSearchField
          id="arsip-process-filter"
          value={processFilter}
          onChange={onProsesBisnisFilterChange}
          placeholder="Saring Proses Bisnis atau Departemen…"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2" aria-busy="true" role="status">
            <span className="sr-only">Memuat daftar ProsesBisnis</span>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : null}
        {isError ? (
          <Card role="alert" className="m-2 border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
            Gagal memuat daftar ProsesBisnis.
          </Card>
        ) : null}
        {!isLoading && !isError && items.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {hasFilter
              ? 'Tidak ada Proses Bisnis atau Departemen yang cocok.'
              : 'Belum ada Proses Bisnis yang memiliki SOP resmi berlaku.'}
          </p>
        ) : null}
        {!isLoading && !isError && items.length > 0 ? (
          <div className="space-y-4">
            {faculty.length > 0 ? (
              <ProsesBisnisGroup
                label="Fakultas"
                icon={<GraduationCap className="h-4 w-4" aria-hidden />}
                items={faculty}
                selectedProsesBisnisId={selectedProsesBisnisId}
                onSelectProsesBisnis={onSelectProsesBisnis}
              />
            ) : null}
            {departemen.length > 0 ? (
              <ProsesBisnisGroup
                label="Departemen"
                icon={<Building2 className="h-4 w-4" aria-hidden />}
                items={departemen}
                selectedProsesBisnisId={selectedProsesBisnisId}
                onSelectProsesBisnis={onSelectProsesBisnis}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {isFetching && !isLoading ? (
        <p className="flex items-center justify-center gap-2 border-t border-border py-2 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Memperbarui…
        </p>
      ) : null}
      {pagination && onPageChange && !isLoading && !isError ? (
        <div className={cn('border-t border-border', compactPagination ? 'px-2 py-2' : 'px-3 py-3')}>
          <Pagination
            currentPage={page}
            totalItems={pagination.totalItems}
            pageSize={pagination.limit}
            label="Proses Bisnis"
            showSinglePageSummary
            onPageChange={onPageChange}
            className={cn('border-t-0 px-0 py-0', compactPagination && 'flex-col gap-2')}
          />
        </div>
      ) : null}
    </aside>
  )
}

function ProsesBisnisGroup({
  label,
  icon,
  items,
  selectedProsesBisnisId,
  onSelectProsesBisnis,
}: {
  label: string
  icon: ReactNode
  items: PublicProsesBisnisItem[]
  selectedProsesBisnisId?: string
  onSelectProsesBisnis: (prosesBisnisId: string) => void
}) {
  return (
    <section aria-label={label}>
      <p className="mb-1.5 flex items-center gap-1.5 px-2 text-xs font-semibold text-secondary-foreground">
        {icon}
        {label}
      </p>
      <ul className="space-y-1" role="listbox" aria-label={`ProsesBisnis ${label}`}>
        {items.map((process) => {
          const isSelected = process.prosesBisnisId === selectedProsesBisnisId
          return (
            <li key={process.prosesBisnisId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                data-arsip-process-id={process.prosesBisnisId}
                onClick={() => onSelectProsesBisnis(process.prosesBisnisId)}
                className={cn(
                  'flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                  isSelected
                    ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-100'
                    : 'border-transparent hover:bg-surface-subtle',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-blue-100 text-blue-700' : 'bg-surface-muted text-secondary-foreground',
                  )}
                >
                  <Workflow className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug text-foreground">
                    {process.nama}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {process.lingkup === 'DEPARTMENT' && process.namaDepartemen
                      ? `${process.namaDepartemen} · `
                      : ''}
                    {process.jumlahSopBerlaku} SOP berlaku
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
