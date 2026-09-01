import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/ui/pagination'
import { cn } from '@/utils/cn'

const tableSurfaceClassName = 'relative isolate overflow-clip rounded-surface border border-border bg-surface'

const DataTableRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, 'aria-label': ariaLabel, ...props }, ref) => (
  <div ref={ref} role="region" tabIndex={0} aria-label={ariaLabel ?? 'Tabel data; gulir secara horizontal untuk melihat kolom lainnya'} className={cn('w-full overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset', className)} {...props} />
))
DataTableRoot.displayName = 'DataTableRoot'

const DataTableCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(tableSurfaceClassName, className)} {...props} />
))
DataTableCard.displayName = 'DataTableCard'

const DataTableTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <table ref={ref} className={cn('w-full border-collapse text-[13px]/[18px] text-foreground', className)} {...props} />
))
DataTableTable.displayName = 'DataTableTable'

const DataTableHeaderRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('sticky top-0 z-10 border-b border-border bg-surface-subtle', className)} {...props} />
))
DataTableHeaderRow.displayName = 'DataTableHeaderRow'

const DataTableBodyRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn('border-b border-border transition-colors last:border-b-0 hover:bg-surface-subtle focus-within:bg-primary-subtle/40', className)} {...props} />
))
DataTableBodyRow.displayName = 'DataTableBodyRow'

const DataTableTh = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'center' | 'right' }>(({ className, align = 'left', ...props }, ref) => {
  const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
  const overrideClasses = cn('font-medium text-secondary-foreground', alignmentClass, className)
  return <th ref={ref} scope="col" className={`whitespace-nowrap px-3 py-2.5 text-[12px]/[16px] text-ui-label ${overrideClasses}`} {...props} />
})
DataTableTh.displayName = 'DataTableTh'

const DataTableTd = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-3 py-2.5 align-middle', className)} {...props} />
))
DataTableTd.displayName = 'DataTableTd'

const DataTableActionTh = React.forwardRef<HTMLTableCellElement, Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'>>(({ className, ...props }, ref) => (
  <DataTableTh ref={ref} className={cn('w-0 whitespace-nowrap text-left', className)} {...props} />
))
DataTableActionTh.displayName = 'DataTableActionTh'

const DataTableActionTd = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <DataTableTd ref={ref} className={cn('w-0 whitespace-nowrap text-left align-middle', className)} {...props} />
))
DataTableActionTd.displayName = 'DataTableActionTd'

interface PaginatedTableProps<T> {
  data: T[]
  pageSize?: number
  label?: string
  children: (pageData: T[], startIndex: number) => React.ReactNode
  className?: string
  surfaceMode?: 'standalone' | 'embedded'
}

function PaginatedTable<T>({
  data,
  pageSize = 10,
  label,
  children,
  className,
  surfaceMode = 'standalone',
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(1)
  const totalPages = data.length === 0 ? 1 : Math.ceil(data.length / pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  useEffect(() => { if (page > totalPages) setPage(1) }, [page, totalPages])
  const startIndex = (safePage - 1) * pageSize
  const pageData = useMemo(() => data.slice(startIndex, startIndex + pageSize), [data, startIndex, pageSize])

  return (
    <div className={cn(surfaceMode === 'standalone' ? tableSurfaceClassName : 'min-w-0', className)}>
      {children(pageData, startIndex)}
      {data.length > pageSize ? <Pagination totalItems={data.length} currentPage={safePage} onPageChange={setPage} pageSize={pageSize} label={label} /> : null}
    </div>
  )
}

export { DataTableRoot, DataTableCard, DataTableTable, DataTableHeaderRow, DataTableBodyRow, DataTableTh, DataTableTd, DataTableActionTh, DataTableActionTd, PaginatedTable }
export { Pagination } from '@/components/ui/pagination'

export const Table = { Root: DataTableRoot, Card: DataTableCard, Table: DataTableTable, HeadRow: DataTableHeaderRow, BodyRow: DataTableBodyRow, Th: DataTableTh, Td: DataTableTd, ActionTh: DataTableActionTh, ActionTd: DataTableActionTd, Pagination, Paginated: PaginatedTable }
