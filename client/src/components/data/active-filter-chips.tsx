import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ActiveFilterChipItem {
  id: string
  label: string
  onRemove: () => void
}

export interface ActiveFilterChipsProps {
  items: ActiveFilterChipItem[]
  onClearAll?: () => void
  clearAllLabel?: string
}

export function ActiveFilterChips({
  items,
  onClearAll,
  clearAllLabel = 'Hapus semua filter',
}: ActiveFilterChipsProps) {
  if (items.length === 0) return null

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex h-7 items-center gap-1 rounded-control border border-border bg-surface-subtle px-2 text-xs text-secondary-foreground"
        >
          <span>{item.label}</span>
          <button
            type="button"
            aria-label={`Hapus filter ${item.label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-control hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={item.onRemove}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}
      {onClearAll ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onClearAll}
        >
          {clearAllLabel}
        </Button>
      ) : null}
    </div>
  )
}
