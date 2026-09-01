import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";

export interface PaginationProps {
  totalItems: number
  currentPage: number
  onPageChange: (page: number) => void
  pageSize?: number
  label?: string
  showSinglePageSummary?: boolean
  className?: string
}

export function Pagination({ totalItems, currentPage, onPageChange, pageSize = DEFAULT_PAGE_SIZE, label = '', showSinglePageSummary = false, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const start = (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)
  const labelText = label ? ` ${label}` : ''

  if (totalItems <= pageSize) {
    if (!showSinglePageSummary) return null
    return <p className={cn('text-center text-ui-body text-muted-foreground', className)} aria-live="polite">{totalItems}{labelText}</p>
  }

  return (
    <nav aria-label={`Navigasi halaman${labelText}`} className={cn('flex flex-col items-stretch justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center', className)}>
      <p className="text-center text-ui-body text-secondary-foreground sm:text-left">{start}–{end} dari {totalItems}{labelText}</p>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <Button type="button" variant="outline" size="sm" className="h-9 px-3" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Sebelumnya</span></Button>
        <span className="min-w-0 flex-1 text-center text-ui-body font-medium text-foreground sm:hidden" aria-current="page">Halaman {safePage} dari {totalPages}</span>
        <button type="button" className="hidden h-9 rounded-control border border-border bg-surface px-3 text-ui-body font-medium text-foreground sm:inline-flex sm:items-center" aria-label={`Halaman ${safePage}`} aria-current="page">Halaman {safePage}</button>
        <Button type="button" variant="outline" size="sm" className="h-9 px-3" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)} aria-label="Selanjutnya"><span className="hidden sm:inline">Selanjutnya</span><ChevronRight className="h-4 w-4" aria-hidden /></Button>
      </div>
    </nav>
  )
}
