/** Cell components for the inline SOP procedure spreadsheet editor. */

import { useEffect, useMemo, useRef } from 'react'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { Input } from '@/components/ui/input'
import type { ProsedurRow } from '@/types/ui/sop'
import { resolveProsedurPelaksanaIdOrFallback } from '@/lib/sop/resolve-prosedur-implementer'

interface CompactTextCellProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function CompactTextCell({ label, value, onChange }: CompactTextCellProps) {
  return (
    <AutoResizeTextarea
      aria-label={label}
      minRows={1}
      maxRows={5}
      className="min-h-9 px-2 py-1.5 text-[13px] leading-5"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export interface KegiatanCellProps {
  value: string
  onChange: (value: string) => void
}

export function KegiatanCell({ value, onChange }: KegiatanCellProps) {
  return <CompactTextCell label="Kegiatan" value={value} onChange={onChange} />
}

type TerminatorRole = 'start' | 'end'

const BASE_TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'decision', label: 'Decision' },
] as const

const OPT_MULAI = { value: 'terminator-start', label: 'Mulai' } as const
const OPT_SELESAI = { value: 'terminator-end', label: 'Selesai' } as const

function typeOptionsForRow(index: number, totalRows: number) {
  if (totalRows <= 1) return [OPT_MULAI]
  if (index === 0) return [OPT_MULAI]
  if (index === totalRows - 1) return [OPT_SELESAI]
  return BASE_TYPE_OPTIONS
}

function isFirstRow(index: number): boolean {
  return index === 0
}

function isLastRow(index: number, totalRows: number): boolean {
  return totalRows > 1 && index === totalRows - 1
}

export interface TypeCellProps {
  row: ProsedurRow
  index: number
  totalRows: number
  stepOrderById: Record<string, number>
  onTypeChange: (type: ProsedurRow['type'], terminatorRole?: TerminatorRole) => void
  normalizePosition?: boolean
}

export function TypeCell({
  row,
  index,
  totalRows,
  stepOrderById,
  onTypeChange,
  normalizePosition = true,
}: TypeCellProps) {
  const onTypeChangeRef = useRef(onTypeChange)
  onTypeChangeRef.current = onTypeChange

  const isDecision = row.type === 'decision'
  const yesTargetOrder = row.id_next_step_if_yes
    ? stepOrderById[row.id_next_step_if_yes]
    : undefined
  const noTargetOrder = row.id_next_step_if_no
    ? stepOrderById[row.id_next_step_if_no]
    : undefined
  const hasDecisionTarget =
    row.id_next_step_if_yes !== undefined || row.id_next_step_if_no !== undefined

  const selectOptions = useMemo(
    () => typeOptionsForRow(index, totalRows),
    [index, totalRows],
  )

  useEffect(() => {
    if (!normalizePosition) return
    if (isFirstRow(index)) {
      if (row.type !== 'terminator' || row.terminatorRole !== 'start') {
        onTypeChangeRef.current('terminator', 'start')
      }
      return
    }
    if (isLastRow(index, totalRows)) {
      if (row.type !== 'terminator' || row.terminatorRole !== 'end') {
        onTypeChangeRef.current('terminator', 'end')
      }
      return
    }
    if (row.type === 'terminator') {
      onTypeChangeRef.current('task')
    }
  }, [row.type, row.terminatorRole, index, totalRows, normalizePosition])

  const displayValue = isFirstRow(index)
    ? 'terminator-start'
    : isLastRow(index, totalRows)
      ? 'terminator-end'
      : row.type === 'decision'
        ? 'decision'
        : 'task'

  const handleChange = (value: string) => {
    if (value === 'terminator-start') {
      onTypeChange('terminator', 'start')
      return
    }
    if (value === 'terminator-end') {
      onTypeChange('terminator', 'end')
      return
    }
    onTypeChange(value as ProsedurRow['type'])
  }

  return (
    <div className="space-y-1">
      <select
        aria-label="Tipe langkah"
        className="h-9 w-full rounded-control border border-border-strong bg-surface px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
      >
        {selectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isDecision ? (
        <p className="text-[10px] leading-snug text-muted-foreground">
          {!hasDecisionTarget
            ? 'Belum diatur cabang Ya/Tidak.'
            : [
                row.id_next_step_if_yes ? `Ya -> urutan ${yesTargetOrder ?? '?'}` : null,
                row.id_next_step_if_no ? `Tidak -> urutan ${noTargetOrder ?? '?'}` : null,
              ]
                .filter(Boolean)
                .join(' • ')}
        </p>
      ) : null}
    </div>
  )
}

export interface ImplementerCellProps {
  row: ProsedurRow
  implementers: { id: string; name: string }[]
  onImplementerChange: (implementerId: string) => void
}

export function ImplementerCell({ row, implementers, onImplementerChange }: ImplementerCellProps) {
  const selectedId = resolveProsedurPelaksanaIdOrFallback(row, implementers[0]?.id ?? '')

  return (
    <select
      aria-label="Pelaksana"
      className="h-9 w-full rounded-control border border-border-strong bg-surface px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      value={selectedId}
      onChange={(event) => onImplementerChange(event.target.value)}
    >
      {implementers.map((implementer) => (
        <option key={implementer.id} value={implementer.id}>
          {implementer.name}
        </option>
      ))}
    </select>
  )
}

export interface MutuKelengkapanCellProps {
  value: string
  onChange: (value: string) => void
}

export function MutuKelengkapanCell({ value, onChange }: MutuKelengkapanCellProps) {
  return <CompactTextCell label="Kelengkapan" value={value} onChange={onChange} />
}

export interface MutuWaktuCellProps {
  value: string
  onChange: (amount: string, unit: string) => void
}

export function MutuWaktuCell({ value, onChange }: MutuWaktuCellProps) {
  const match = (value || '').match(/^(\d+)\s*(\w+)?/i)
  const amount = match ? match[1] : ''
  const rawUnit = match && match[2] ? match[2].toLowerCase() : ''

  const unit = rawUnit.startsWith('menit') || rawUnit === 'm'
    ? 'm'
    : rawUnit.startsWith('jam') || rawUnit === 'h'
      ? 'h'
      : rawUnit.startsWith('hari') || rawUnit === 'd'
        ? 'd'
        : rawUnit.startsWith('minggu') || rawUnit === 'w'
          ? 'w'
          : rawUnit.startsWith('bulan') || rawUnit === 'mo'
            ? 'mo'
            : 'm'

  return (
    <div
      data-testid="procedure-time-control"
      className="flex min-w-[11rem] items-stretch overflow-hidden rounded-control border border-border-strong bg-surface focus-within:ring-2 focus-within:ring-primary"
    >
      <Input
        aria-label="Jumlah waktu"
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="0"
        className="h-9 min-h-9 w-[4.25rem] shrink-0 rounded-none border-0 border-r border-border px-2 py-1.5 text-center text-[13px] tabular-nums focus-visible:ring-0"
        value={amount}
        onChange={(event) => onChange(event.target.value, unit)}
      />
      <select
        aria-label="Satuan waktu"
        className="h-9 min-h-9 min-w-0 flex-1 border-0 bg-surface px-2 pr-7 text-[13px] text-foreground outline-none focus-visible:ring-0"
        value={unit}
        onChange={(event) => onChange(amount, event.target.value)}
      >
        <option value="m">Menit</option>
        <option value="h">Jam</option>
        <option value="d">Hari</option>
        <option value="w">Minggu</option>
        <option value="mo">Bulan</option>
      </select>
    </div>
  )
}

export interface OutputCellProps {
  value: string
  onChange: (value: string) => void
}

export function OutputCell({ value, onChange }: OutputCellProps) {
  return <CompactTextCell label="Output" value={value} onChange={onChange} />
}

export interface KeteranganCellProps {
  value: string
  onChange: (value: string) => void
}

export function KeteranganCell({ value, onChange }: KeteranganCellProps) {
  return <CompactTextCell label="Keterangan" value={value} onChange={onChange} />
}
