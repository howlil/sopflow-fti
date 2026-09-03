import type { ReactNode } from 'react'
import { Building2, GraduationCap, Loader2, Workflow } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { PaginationMetaDto } from '@/types/dto/evaluasi.dto'
import type { PublicProcessItem } from '@/types/dto/sop-public.dto'
import { ArsipSearchField } from './arsip-chrome'

export interface ArsipProcessSidebarProps {
  items: PublicProcessItem[]
  selectedProcessId?: string
  processFilter: string
  onProcessFilterChange: (value: string) => void
  onSelectProcess: (processId: string) => void
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  pagination?: PaginationMetaDto
  page?: number
  onPageChange?: (page: number) => void
  embedded?: boolean
  compactPagination?: boolean
}

export function ArsipProcessSidebar({
  items,
  selectedProcessId,
  processFilter,
  onProcessFilterChange,
  onSelectProcess,
  isLoading,
  isError,
  isFetching,
  pagination,
  page = 1,
  onPageChange,
  embedded = false,
  compactPagination = false,
}: ArsipProcessSidebarProps) {
  const faculty = items.filter((item) => item.scope === 'FACULTY')
  const departments = items.filter((item) => item.scope === 'DEPARTMENT')
  const hasFilter = processFilter.trim().length > 0

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 flex-col bg-surface',
        !embedded &&
          'max-h-[calc(100vh-12rem)] min-h-[calc(100vh-12rem)] rounded-xl border border-border shadow-surface',
      )}
      aria-label="Daftar Process FTI"
    >
      <div className="border-b border-border p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Konteks FTI
        </p>
        <ArsipSearchField
          id="arsip-process-filter"
          value={processFilter}
          onChange={onProcessFilterChange}
          placeholder="Saring Process atau Departemen…"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2" aria-busy="true" role="status">
            <span className="sr-only">Memuat daftar Process</span>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : null}
        {isError ? (
          <Card role="alert" className="m-2 border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
            Gagal memuat daftar Process.
          </Card>
        ) : null}
        {!isLoading && !isError && items.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {hasFilter
              ? 'Tidak ada Process atau Departemen yang cocok.'
              : 'Belum ada Process yang memiliki SOP resmi berlaku.'}
          </p>
        ) : null}
        {!isLoading && !isError && items.length > 0 ? (
          <div className="space-y-4">
            {faculty.length > 0 ? (
              <ProcessGroup
                label="Fakultas"
                icon={<GraduationCap className="h-4 w-4" aria-hidden />}
                items={faculty}
                selectedProcessId={selectedProcessId}
                onSelectProcess={onSelectProcess}
              />
            ) : null}
            {departments.length > 0 ? (
              <ProcessGroup
                label="Departemen"
                icon={<Building2 className="h-4 w-4" aria-hidden />}
                items={departments}
                selectedProcessId={selectedProcessId}
                onSelectProcess={onSelectProcess}
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
            label="Process"
            showSinglePageSummary
            onPageChange={onPageChange}
            className={cn('border-t-0 px-0 py-0', compactPagination && 'flex-col gap-2')}
          />
        </div>
      ) : null}
    </aside>
  )
}

function ProcessGroup({
  label,
  icon,
  items,
  selectedProcessId,
  onSelectProcess,
}: {
  label: string
  icon: ReactNode
  items: PublicProcessItem[]
  selectedProcessId?: string
  onSelectProcess: (processId: string) => void
}) {
  return (
    <section aria-label={label}>
      <p className="mb-1.5 flex items-center gap-1.5 px-2 text-xs font-semibold text-secondary-foreground">
        {icon}
        {label}
      </p>
      <ul className="space-y-1" role="listbox" aria-label={`Process ${label}`}>
        {items.map((process) => {
          const isSelected = process.processId === selectedProcessId
          return (
            <li key={process.processId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                data-arsip-process-id={process.processId}
                onClick={() => onSelectProcess(process.processId)}
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
                    {process.scope === 'DEPARTMENT' && process.departmentName
                      ? `${process.departmentName} · `
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
