import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { DocumentPreviewEmptyState } from '@/components/pengajuan/document-preview-empty-state'
import {
  SOPPreviewTemplate,
  type SOPPreviewTemplateProps,
} from '@/components/sop/sop-preview-template'
import { useSopPreviewDiagramState } from '@/hooks/use-sop-preview-diagram-state'
import type { PenyusunWorkbenchDiagramKonfigurasi } from '@/types/dto/sop.dto'
import type { TTESignaturePayload } from '@/types/dto/tte.dto'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { cn } from '@/utils/cn'

export interface SopPreviewWorkbenchProps {
  name?: string
  number?: string
  metadata: SOPPreviewTemplateProps['metadata']
  prosedurRows: SOPPreviewTemplateProps['prosedurRows']
  implementers: SOPPreviewTemplateProps['implementers']
  diagramKonfigurasi?: PenyusunWorkbenchDiagramKonfigurasi
}

export interface SopDocumentPreviewPaneProps {
  selectedSop: { nama: string; nomor: string } | null | undefined
  isLoading: boolean
  sopPreviewProps: SopPreviewWorkbenchProps | null
  tteSignaturePayload?: TTESignaturePayload | null
  loadingMessage?: string
  errorMessage?: string
  onRetry?: () => void
}

function DiagramToggleButton({
  value,
  activeTab,
  onSelect,
  children,
}: {
  value: 'flowchart' | 'bpmn'
  activeTab: 'flowchart' | 'bpmn'
  onSelect: (value: 'flowchart' | 'bpmn') => void
  children: string
}) {
  const isActive = activeTab === value
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={isActive}
      className={cn(
        'h-7 rounded-md px-3 text-xs text-secondary-foreground hover:bg-surface hover:text-foreground',
        isActive && 'bg-surface text-foreground shadow-surface ring-1 ring-border/70',
      )}
      onClick={() => onSelect(value)}
    >
      {children}
    </Button>
  )
}

function SopPreviewWithDiagram({
  previewProps,
  tteSignaturePayload,
}: {
  previewProps: SopPreviewWorkbenchProps
  tteSignaturePayload: TTESignaturePayload | null
}) {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'bpmn'>('flowchart')
  const diagramState = useSopPreviewDiagramState(
    {
      diagramKonfigurasi: previewProps.diagramKonfigurasi,
      prosedurRows: previewProps.prosedurRows ?? [],
      implementers: previewProps.implementers ?? [],
    },
    activeTab,
  )
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-subtle/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 print:hidden">
        <div>
          <p className="text-xs font-medium text-foreground">Pratinjau dokumen SOP</p>
          <p className="text-[11px] text-muted-foreground">Pilih tampilan diagram yang ingin diperiksa.</p>
        </div>
        <div
          role="toolbar"
          aria-label="Tampilan diagram SOP"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-subtle p-1"
        >
          <DiagramToggleButton value="flowchart" activeTab={activeTab} onSelect={setActiveTab}>
            Flowchart
          </DiagramToggleButton>
          <DiagramToggleButton value="bpmn" activeTab={activeTab} onSelect={setActiveTab}>
            BPMN
          </DiagramToggleButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <SOPPreviewTemplate
          name={previewProps.name}
          number={previewProps.number}
          metadata={previewProps.metadata}
          prosedurRows={previewProps.prosedurRows}
          implementers={previewProps.implementers}
          tteSignaturePayload={tteSignaturePayload}
          previewOptions={{ editable: false, showScrollbar: true, hideDiagramTabs: true }}
          diagramState={{
            activeTab,
            onActiveTabChange: setActiveTab,
            ...diagramState,
          }}
        />
      </div>
    </div>
  )
}

export function SopDocumentPreviewPane({
  selectedSop,
  isLoading,
  sopPreviewProps,
  tteSignaturePayload = null,
  loadingMessage = 'Memuat dokumen SOP...',
  errorMessage,
  onRetry,
}: SopDocumentPreviewPaneProps) {
  if (selectedSop == null) {
    return <DocumentPreviewEmptyState />
  }
  if (isLoading) {
    return <LoadingState className="min-h-64" message={loadingMessage} />
  }
  if (errorMessage != null && onRetry != null && sopPreviewProps === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-danger" aria-hidden />
        <p className="max-w-md text-sm text-secondary-foreground">{errorMessage}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    )
  }
  if (sopPreviewProps !== null) {
    return (
      <SopPreviewWithDiagram
        previewProps={sopPreviewProps}
        tteSignaturePayload={tteSignaturePayload}
      />
    )
  }
  return (
    <div className="min-h-0 flex-1 overflow-hidden bg-surface-subtle/40">
      <SOPPreviewTemplate
        name={selectedSop.nama}
        number={selectedSop.nomor}
        tteSignaturePayload={tteSignaturePayload}
        previewOptions={{ editable: false, showScrollbar: true, hideDiagramTabs: true }}
      />
    </div>
  )
}
