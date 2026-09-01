import { Button } from '@/components/ui/button'
import type { TahapPenilaianSop } from '@/lib/evaluasi/evaluasi-domain'
import { cn } from '@/utils/cn'

export interface SOPListItem {
  id: string
  nama: string
  nomor: string
  statusDokumen?: string
  statusDokumenLabel?: string
  hasilEvaluasi?: string
  hasilEvaluasiLabel?: string
  statusTindakLanjut?: string | null
  statusTindakLanjutLabel?: string | null
  tahapPenilaian?: TahapPenilaianSop
}

export interface SOPListCardProps {
  items: SOPListItem[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
  variant?: 'default' | 'compact'
}

const ITEM_BASE_CLASS =
  'group relative w-full justify-start text-left h-auto rounded-md border px-2.5 py-2 text-xs transition-colors flex flex-col items-stretch'
const DEFAULT_ITEM_CLASS =
  'border-transparent bg-transparent text-secondary-foreground hover:border-border hover:bg-surface-subtle'
const DEFAULT_SELECTED_ITEM_CLASS =
  'border-border bg-surface text-foreground'
const COMPACT_ITEM_CLASS =
  'rounded-control border border-border bg-surface px-3 py-2.5 text-secondary-foreground hover:bg-surface-subtle'
const COMPACT_SELECTED_ITEM_CLASS =
  'border-primary bg-primary-subtle text-foreground'

function getStatusChipClass(label?: string | null, status?: string | null) {
  const raw = `${status ?? ''} ${label ?? ''}`.toLowerCase()
  if (raw.includes('draft')) {
    return 'border-border bg-surface-muted text-secondary-foreground'
  }
  if (raw.includes('menunggu') || raw.includes('ttd') || raw.includes('tanda tangan')) {
    return 'border-warning/30 bg-warning/10 text-warning-foreground'
  }
  if (raw.includes('dalam') || raw.includes('proses') || raw.includes('penilaian')) {
    return 'border-primary/20 bg-primary-subtle/70 text-primary-hover'
  }
  if (raw.includes('ditolak') || raw.includes('cabut') || raw.includes('dicabut')) {
    return 'border-danger/30 bg-danger/10 text-danger'
  }
  if (raw.includes('berlaku') || raw.includes('sesuai') || raw.includes('selesai')) {
    return 'border-success-subtle bg-success-subtle/70 text-success-foreground'
  }
  return 'border-border bg-surface-muted text-secondary-foreground'
}

function StatusChip({
  label,
  status,
  compact,
}: {
  label?: string | null
  status?: string | null
  compact: boolean
}) {
  if (!label) return null
  return (
    <span
      className={cn(
        'max-w-full truncate border px-1.5 py-0.5 font-medium',
        compact ? 'rounded-sm text-[10px] leading-4' : 'rounded-full',
        getStatusChipClass(label, status),
      )}
      title={label}
    >
      {label}
    </span>
  )
}

function renderQuietStatus(sop: SOPListItem, compact: boolean) {
  const statusDokumenLabel = sop.statusDokumenLabel
  const hasPenilaian =
    sop.hasilEvaluasi !== undefined && sop.hasilEvaluasiLabel !== undefined

  if (!statusDokumenLabel && !hasPenilaian && !sop.statusTindakLanjutLabel) return null

  return (
    <div
      className={cn(
        'mt-1 flex flex-wrap items-center text-muted-foreground',
        compact ? 'gap-1 text-[10px] leading-4' : 'gap-1.5 text-[11px] leading-4',
      )}
    >
      <StatusChip label={statusDokumenLabel} status={sop.statusDokumen} compact={compact} />
      {hasPenilaian ? (
        <StatusChip label={sop.hasilEvaluasiLabel} status={sop.hasilEvaluasi} compact={compact} />
      ) : null}
      <StatusChip
        label={sop.statusTindakLanjutLabel}
        status={sop.statusTindakLanjut}
        compact={compact}
      />
    </div>
  )
}

function getItemClassName(variant: SOPListCardProps['variant'], isSelected: boolean) {
  if (variant === 'compact') {
    return cn(
      ITEM_BASE_CLASS,
      COMPACT_ITEM_CLASS,
      isSelected && COMPACT_SELECTED_ITEM_CLASS,
    )
  }

  return cn(
    ITEM_BASE_CLASS,
    DEFAULT_ITEM_CLASS,
    isSelected && DEFAULT_SELECTED_ITEM_CLASS,
  )
}

function SelectionRail({ compact, isSelected }: { compact: boolean; isSelected: boolean }) {
  if (compact) return null

  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-transparent transition-colors',
        isSelected && 'bg-primary',
      )}
    />
  )
}

function SopListItemButton({
  sop,
  isSelected,
  onSelect,
  variant,
}: {
  sop: SOPListItem
  isSelected: boolean
  onSelect: (id: string) => void
  variant: SOPListCardProps['variant']
}) {
  const compact = variant === 'compact'

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={isSelected}
      className={getItemClassName(variant, isSelected)}
      onClick={() => onSelect(sop.id)}
    >
      <SelectionRail compact={compact} isSelected={isSelected} />
      <p className="w-full truncate font-medium leading-snug">{sop.nama}</p>
      <div className="mt-0.5">{renderQuietStatus(sop, compact)}</div>
    </Button>
  )
}

export function SOPListCard({
  items,
  selectedId = null,
  onSelect,
  className,
  variant = 'default',
}: SOPListCardProps) {
  if (items.length === 0) {
    return (
      <div className={cn('p-2 text-xs text-muted-foreground', className)}>
        Tidak ada SOP
      </div>
    )
  }

  const compact = variant === 'compact'

  return (
    <div className={cn(compact ? 'space-y-2 px-2' : 'space-y-1', className)}>
      {items.map((sop) => {
        const isSelected = selectedId === sop.id
        if (onSelect != null) {
          return (
            <SopListItemButton
              key={sop.id}
              sop={sop}
              isSelected={isSelected}
              onSelect={onSelect}
              variant={variant}
            />
          )
        }
        return (
          <div key={sop.id} className={getItemClassName(variant, isSelected)}>
            <SelectionRail compact={compact} isSelected={isSelected} />
            <p className="w-full truncate font-medium leading-snug">{sop.nama}</p>
            <div className="mt-0.5">{renderQuietStatus(sop, compact)}</div>
          </div>
        )
      })}
    </div>
  )
}
