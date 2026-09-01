/**
 * Picker skor 1–5 (untuk evaluasi OPD).
 */
import { FormField } from '@/components/ui/form-field'
import { InlineHelperNote } from '@/components/ui/inline-helper-note'
import { useRef, type KeyboardEvent } from 'react'

const SKOR_OPTIONS = [1, 2, 3, 4, 5] as const

const SKOR_LABELS: Record<(typeof SKOR_OPTIONS)[number], string> = {
  1: 'Sangat rendah',
  2: 'Rendah',
  3: 'Sedang',
  4: 'Tinggi',
  5: 'Sangat tinggi',
}

export interface SkorRatingPickerProps {
  value: number | null
  onChange: (value: number) => void
  label?: string
  hint?: string
  disabled?: boolean
}

export function SkorRatingPicker({
  value,
  onChange,
  label = 'Nilai evaluasi OPD (1–5)',
  hint = 'Pilih nilai evaluasi OPD untuk SOP ini.',
  disabled = false,
}: SkorRatingPickerProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % SKOR_OPTIONS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + SKOR_OPTIONS.length) % SKOR_OPTIONS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = SKOR_OPTIONS.length - 1
    }
    if (nextIndex == null) return
    event.preventDefault()
    const nextValue = SKOR_OPTIONS[nextIndex]
    if (nextValue == null) return
    onChange(nextValue)
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <FormField label={label}>
      <div
        className="flex flex-wrap justify-center gap-1.5"
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
      >
        {SKOR_OPTIONS.map((n, index) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            tabIndex={value === n || (value === null && index === 0) ? 0 : -1}
            ref={(node) => {
              optionRefs.current[index] = node
            }}
            disabled={disabled}
            aria-label={`${n} - ${SKOR_LABELS[n]}`}
            title={`${n} - ${SKOR_LABELS[n]}`}
            onClick={() => {
              if (!disabled) {
                onChange(n)
              }
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`h-9 w-9 rounded-md border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              value === n
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border bg-surface text-secondary-foreground hover:bg-surface-subtle'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <InlineHelperNote label="Skala nilai" className="mt-2">
        1 sangat rendah · 2 rendah · 3 sedang · 4 tinggi · 5 sangat tinggi.
      </InlineHelperNote>
    </FormField>
  )
}
