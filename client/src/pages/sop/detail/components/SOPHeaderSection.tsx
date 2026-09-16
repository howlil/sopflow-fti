import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/textarea'
import { AddItemIconButton, EditableStringList } from '@/components/ui/editable-string-list'
import { FieldWithCornerRemoveButton } from '@/components/ui/field-with-corner-remove-button'
import type { SOPDetailMetadata } from '@/types/ui/sop'
import { cn } from '@/utils/cn'
import { useSopEditor } from '../SopEditorContext'

/** Memecah teks jadi array baris; baris kosong dipertahankan agar Enter = baris baru. */
function toLinesKeepEmpty(value: string): string[] {
  return value.split('\n')
}

/** Sama seperti panel utama / `toPreviewMetadata`: judul & nomor dari field API. */
function metadataDisplayName(meta: SOPDetailMetadata): string {
  return meta.nama ?? meta.judul ?? meta.name ?? ''
}

function metadataDisplayNumber(meta: SOPDetailMetadata): string {
  return meta.nomorSOP ?? meta.nomor ?? meta.number ?? ''
}

/** Tampilan textarea lembaga: baris terstruktur atau teks `lembaga` mentah. */
function metadataInstitutionTextareaValue(meta: SOPDetailMetadata): string {
  if (meta.institutionLines !== undefined && meta.institutionLines.length > 0) {
    return meta.institutionLines.join('\n')
  }
  return meta.lembaga ?? ''
}

function asArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v.length > 0) return [v]
  return []
}

function InspectorSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="border-b border-border py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function ReadOnlyTextBlock({
  value,
  placeholder,
  multiline = false,
}: {
  value: string
  placeholder: string
  multiline?: boolean
}) {
  const hasValue = value.trim().length > 0
  return (
    <div
      className={cn(
        'text-xs text-foreground',
        multiline ? 'whitespace-pre-wrap leading-relaxed' : 'min-h-5',
      )}
    >
      {hasValue ? value : <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  )
}

export interface SOPHeaderSectionProps {
  onOpenLawBasisDialog: () => void
  onOpenRelatedPosDialog: () => void
  onOpenPelaksanaDialog?: () => void
}

/**
 * Inspector metadata header SOP. Mengonsumsi state metadata/implementers dari
 * `useSopEditor()` dan hanya menerima callback untuk membuka dialog pemilih.
 */
export function SOPHeaderSection({
  onOpenLawBasisDialog,
  onOpenRelatedPosDialog,
  onOpenPelaksanaDialog,
}: SOPHeaderSectionProps) {
  const { metadata, handleMetadataChange, implementers, setImplementers, isReadOnly } =
    useSopEditor()

  const institutionText = metadataInstitutionTextareaValue(metadata)
  const sopName = metadataDisplayName(metadata)
  const sopNumber = metadataDisplayNumber(metadata)

  return (
    <div>
      <InspectorSection title="Identitas lembaga">
        {isReadOnly ? (
          <ReadOnlyTextBlock value={institutionText} placeholder="Belum diisi." multiline />
        ) : (
          <Textarea
            className="min-h-[84px] text-xs"
            value={institutionText}
            onChange={(e) => {
              const lines = toLinesKeepEmpty(e.target.value)
              handleMetadataChange('institutionLines', lines)
              handleMetadataChange('lembaga', lines.join('\n'))
            }}
            placeholder="Baris 1&#10;Baris 2&#10;Baris 3&#10;Baris 4"
          />
        )}
      </InspectorSection>

      <InspectorSection title="Identitas SOP">
        <FormField label={<span className="font-medium text-foreground">Nama SOP</span>}>
          {isReadOnly ? (
            <ReadOnlyTextBlock value={sopName} placeholder="Belum ada nama SOP." />
          ) : (
            <AutoResizeTextarea
              className="min-h-9 py-1.5 text-xs"
              minRows={1}
              maxRows={8}
              value={sopName}
              onChange={(e) => {
                const value = e.target.value
                handleMetadataChange('judul', value)
                handleMetadataChange('nama', value)
              }}
              placeholder="Judul SOP"
            />
          )}
        </FormField>
        <FormField label={<span className="font-medium text-foreground">Nomor SOP</span>}>
          {isReadOnly ? (
            <ReadOnlyTextBlock value={sopNumber} placeholder="Belum ada nomor SOP." />
          ) : (
            <Input
              className="h-9 text-xs"
              value={sopNumber}
              onChange={(e) => {
                const value = e.target.value
                handleMetadataChange('nomorSOP', value)
                handleMetadataChange('nomor', value)
              }}
              placeholder="Mis. 001/SOP/2026"
            />
          )}
        </FormField>
      </InspectorSection>

      <InspectorSection
        title="Dasar hukum"
        action={
          !isReadOnly ? (
            <AddItemIconButton onClick={onOpenLawBasisDialog} label="Tambah dasar hukum" />
          ) : undefined
        }
      >
        <div className="space-y-1">
          {(metadata.lawBasis ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada dasar hukum.</p>
          ) : (
            (metadata.lawBasis ?? []).map((item: string, idx: number) =>
              !isReadOnly ? (
                <FieldWithCornerRemoveButton
                  key={`${idx}-${item}`}
                  className="rounded-md border border-border bg-surface"
                  contentClassName="px-2.5 py-2 pr-8 text-xs text-secondary-foreground"
                  onRemove={() => {
                    const nextLabels = (metadata.lawBasis ?? []).filter((_, i) => i !== idx)
                    const nextIds = (metadata.lawBasisIds ?? []).filter((_, i) => i !== idx)
                    handleMetadataChange('lawBasis', nextLabels)
                    handleMetadataChange('lawBasisIds', nextIds)
                  }}
                >
                  {item}
                </FieldWithCornerRemoveButton>
              ) : (
                <p key={`${idx}-${item}`} className="text-xs leading-relaxed text-secondary-foreground">
                  {item}
                </p>
              ),
            )
          )}
        </div>
      </InspectorSection>

      <InspectorSection
        title="Keterkaitan dengan SOP"
        action={
          !isReadOnly ? (
            <AddItemIconButton onClick={onOpenRelatedPosDialog} label="Tambah keterkaitan SOP" />
          ) : undefined
        }
      >
        <div className="space-y-1">
          {(metadata.relatedSop ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada keterkaitan SOP.</p>
          ) : (
            (metadata.relatedSop ?? []).map((item: string, idx: number) =>
              !isReadOnly ? (
                <FieldWithCornerRemoveButton
                  key={`${idx}-${item}`}
                  className="rounded-md border border-border bg-surface"
                  contentClassName="px-2.5 py-2 pr-8 text-xs text-secondary-foreground"
                  onRemove={() => {
                    const nextLabels = (metadata.relatedSop ?? []).filter((_, i) => i !== idx)
                    const nextIds = (metadata.relatedSopDetailIds ?? []).filter((_, i) => i !== idx)
                    handleMetadataChange('relatedSop', nextLabels)
                    handleMetadataChange('relatedSopDetailIds', nextIds)
                  }}
                >
                  {item}
                </FieldWithCornerRemoveButton>
              ) : (
                <p key={`${idx}-${item}`} className="text-xs leading-relaxed text-secondary-foreground">
                  {item}
                </p>
              ),
            )
          )}
        </div>
      </InspectorSection>

      <InspectorSection
        title="Peringatan"
        action={
          !isReadOnly ? (
            <AddItemIconButton
              onClick={() => handleMetadataChange('warning', [...asArray(metadata.warning), ''])}
              label="Tambah peringatan"
            />
          ) : undefined
        }
      >
        {isReadOnly ? (
          <ul className="list-disc space-y-1 pl-4">
            {asArray(metadata.warning).length === 0 ? (
              <li className="text-xs text-muted-foreground">Tidak ada peringatan.</li>
            ) : (
              asArray(metadata.warning).map((line, idx) => (
                <li key={`${idx}-${line}`} className="text-xs text-secondary-foreground">
                  {line}
                </li>
              ))
            )}
          </ul>
        ) : (
          <EditableStringList
            items={asArray(metadata.warning)}
            onChange={(next) => handleMetadataChange('warning', next)}
            placeholder="Peringatan"
            emptyMessage="Belum ada peringatan."
            showAddButton={false}
          />
        )}
      </InspectorSection>

      <InspectorSection
        title="Kualifikasi pelaksanaan"
        action={
          !isReadOnly ? (
            <AddItemIconButton
              onClick={() =>
                handleMetadataChange('implementQualification', [
                  ...asArray(metadata.implementQualification),
                  '',
                ])
              }
              label="Tambah kualifikasi"
            />
          ) : undefined
        }
      >
        {isReadOnly ? (
          <ul className="list-disc space-y-1 pl-4">
            {asArray(metadata.implementQualification).length === 0 ? (
              <li className="text-xs text-muted-foreground">Belum ada kualifikasi.</li>
            ) : (
              asArray(metadata.implementQualification).map((line, idx) => (
                <li key={`${idx}-${line}`} className="text-xs text-secondary-foreground">
                  {line}
                </li>
              ))
            )}
          </ul>
        ) : (
          <EditableStringList
            items={asArray(metadata.implementQualification)}
            onChange={(next) => handleMetadataChange('implementQualification', next)}
            placeholder="Kualifikasi"
            emptyMessage="Belum ada kualifikasi."
            showAddButton={false}
          />
        )}
      </InspectorSection>

      <InspectorSection
        title="Peralatan dan perlengkapan"
        action={
          !isReadOnly ? (
            <AddItemIconButton
              onClick={() => handleMetadataChange('equipment', [...asArray(metadata.equipment), ''])}
              label="Tambah peralatan"
            />
          ) : undefined
        }
      >
        {isReadOnly ? (
          <ul className="list-disc space-y-1 pl-4">
            {asArray(metadata.equipment).length === 0 ? (
              <li className="text-xs text-muted-foreground">Belum ada peralatan/perlengkapan.</li>
            ) : (
              asArray(metadata.equipment).map((line, idx) => (
                <li key={`${idx}-${line}`} className="text-xs text-secondary-foreground">
                  {line}
                </li>
              ))
            )}
          </ul>
        ) : (
          <EditableStringList
            items={asArray(metadata.equipment)}
            onChange={(next) => handleMetadataChange('equipment', next)}
            placeholder="Peralatan"
            emptyMessage="Belum ada peralatan/perlengkapan."
            showAddButton={false}
          />
        )}
      </InspectorSection>

      <InspectorSection
        title="Pencatatan dan pendataan"
        action={
          !isReadOnly ? (
            <AddItemIconButton
              onClick={() => handleMetadataChange('recordData', [...asArray(metadata.recordData), ''])}
              label="Tambah pencatatan"
            />
          ) : undefined
        }
      >
        {isReadOnly ? (
          <ul className="list-disc space-y-1 pl-4">
            {asArray(metadata.recordData).length === 0 ? (
              <li className="text-xs text-muted-foreground">Belum ada pencatatan/pendataan.</li>
            ) : (
              asArray(metadata.recordData).map((line, idx) => (
                <li key={`${idx}-${line}`} className="text-xs text-secondary-foreground">
                  {line}
                </li>
              ))
            )}
          </ul>
        ) : (
          <EditableStringList
            items={asArray(metadata.recordData)}
            onChange={(next) => handleMetadataChange('recordData', next)}
            placeholder="Pencatatan"
            emptyMessage="Belum ada pencatatan/pendataan."
            showAddButton={false}
          />
        )}
      </InspectorSection>

      <InspectorSection
        title="Aktor pelaksana"
        action={
          !isReadOnly && onOpenPelaksanaDialog ? (
            <AddItemIconButton onClick={onOpenPelaksanaDialog} label="Tambah aktor pelaksana" />
          ) : undefined
        }
      >
        <div className="space-y-1">
          {implementers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada aktor pelaksana.</p>
          ) : (
            implementers.map((implementer, idx) =>
              !isReadOnly ? (
                <FieldWithCornerRemoveButton
                  key={implementer.id}
                  className="rounded-md border border-border bg-surface"
                  contentClassName="px-2.5 py-2 pr-8 text-xs text-secondary-foreground"
                  onRemove={() => setImplementers((prev) => prev.filter((_, i) => i !== idx))}
                >
                  {implementer.name}
                </FieldWithCornerRemoveButton>
              ) : (
                <p key={implementer.id} className="text-xs text-secondary-foreground">
                  {implementer.name}
                </p>
              ),
            )
          )}
        </div>
      </InspectorSection>

      {isReadOnly ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>Mode lihat aktif. Metadata SOP hanya dapat dibaca pada versi ini.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
