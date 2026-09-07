import { useState } from 'react'
import { PanelLeft, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CollapsedStripButton,
  CollapsibleSidePanel,
  CollapsibleSidePanelContent,
  CollapsibleSidePanelHeader,
  SimplePanelHeader,
} from '@/components/ui/collapsible-side-panel'
import type { PaginationMetaDto } from '@/types/dto/common.dto'
import type { PublicProsesBisnisItem, PublicSopItem } from '@/types/dto/sop-public.dto'
import { ArsipProsesBisnisSidebar } from './arsip-proses-bisnis-sidebar'
import { ArsipSopPanel } from './arsip-sop-panel'
import { ArsipSopPreviewPane } from './arsip-sop-preview-pane'

export interface ArsipBrowseWorkspaceProps {
  isGlobalMode: boolean
  prosesBisnisId?: string
  selectedProsesBisnisName?: string
  detailSopId?: string
  selectedSop?: PublicSopItem
  selectedSopContext?: string
  processItems: PublicProsesBisnisItem[]
  processFilter: string
  onProsesBisnisFilterChange: (value: string) => void
  onSelectProsesBisnis: (prosesBisnisId: string) => void
  onChangeProsesBisnis: () => void
  processLoading: boolean
  processError: boolean
  processFetching: boolean
  processPagination?: PaginationMetaDto
  processPage: number
  onProsesBisnisPageChange: (page: number) => void
  sopPanelTitle: string
  sopPanelSubtitle?: string
  sopItems: PublicSopItem[]
  sopPagination?: PaginationMetaDto
  sopPage: number
  onSopPageChange: (page: number) => void
  sopLoading: boolean
  sopError: boolean
  sopFetching: boolean
  showContextColumn: boolean
  showSopSearchFilter: boolean
  sopSearch: string
  onSopSearchChange: (value: string) => void
  onSelectSop: (sop: PublicSopItem) => void
  onClosePreview: () => void
  onRefreshPreview: () => void
  sopEmptyTitle: string
  sopEmptyHint: string
}

export function ArsipBrowseWorkspace(props: ArsipBrowseWorkspaceProps) {
  const {
    isGlobalMode,
    prosesBisnisId,
    selectedProsesBisnisName,
    detailSopId,
    selectedSop,
    selectedSopContext,
    processItems,
    processFilter,
    onProsesBisnisFilterChange,
    onSelectProsesBisnis,
    onChangeProsesBisnis,
    processLoading,
    processError,
    processFetching,
    processPagination,
    processPage,
    onProsesBisnisPageChange,
    sopPanelTitle,
    sopPanelSubtitle,
    sopItems,
    sopPagination,
    sopPage,
    onSopPageChange,
    sopLoading,
    sopError,
    sopFetching,
    showContextColumn,
    showSopSearchFilter,
    sopSearch,
    onSopSearchChange,
    onSelectSop,
    onClosePreview,
    onRefreshPreview,
    sopEmptyTitle,
    sopEmptyHint,
  } = props
  const [navCollapsed, setNavCollapsed] = useState(false)
  const showSopList = isGlobalMode || Boolean(prosesBisnisId)
  const showProsesBisnisPicker = !isGlobalMode && !prosesBisnisId

  return (
    <div
      className="hidden h-[calc(100dvh-14rem)] min-h-[min(420px,55vh)] max-h-[calc(100dvh-10rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-surface lg:flex"
      aria-label="Penelusuran arsip SOP"
    >
      <CollapsibleSidePanel
        side="left"
        collapsed={navCollapsed}
        widthCollapsed="w-12"
        widthExpanded="w-[min(380px,36vw)]"
        className="h-full max-h-none shrink-0"
      >
        {navCollapsed ? (
          <CollapsedStripButton
            label="Navigasi"
            icon={<PanelLeft className="h-4 w-4 text-muted-foreground" />}
            onClick={() => setNavCollapsed(false)}
          />
        ) : (
          <>
            <CollapsibleSidePanelHeader
              side="left"
              onCollapse={() => setNavCollapsed(true)}
              className="border-border bg-surface-subtle/90 px-2 py-1.5 sm:px-2.5"
            >
              <SimplePanelHeader
                title={isGlobalMode ? 'Hasil pencarian' : 'Navigasi'}
                subtitle={sopPanelSubtitle}
              />
            </CollapsibleSidePanelHeader>
            <CollapsibleSidePanelContent className="flex min-h-0 flex-1 flex-col px-0 pb-0 pt-0">
              {showProsesBisnisPicker ? (
                <ArsipProsesBisnisSidebar
                  embedded
                  compactPagination
                  items={processItems}
                  selectedProsesBisnisId={prosesBisnisId}
                  processFilter={processFilter}
                  onProsesBisnisFilterChange={onProsesBisnisFilterChange}
                  onSelectProsesBisnis={onSelectProsesBisnis}
                  isLoading={processLoading}
                  isError={processError}
                  isFetching={processFetching}
                  pagination={processPagination}
                  page={processPage}
                  onPageChange={onProsesBisnisPageChange}
                />
              ) : null}
              {!isGlobalMode && prosesBisnisId ? (
                <SelectedProsesBisnisStrip
                  namaProsesBisnis={selectedProsesBisnisName ?? 'Proses Bisnis terpilih'}
                  onChangeProsesBisnis={onChangeProsesBisnis}
                />
              ) : null}
              <div className="flex min-h-0 flex-1 flex-col">
                {showSopList ? (
                  <ArsipSopPanel
                    embedded
                    hideHeader
                    listVariant="compact"
                    title={sopPanelTitle}
                    subtitle={sopPanelSubtitle}
                    items={sopItems}
                    pagination={sopPagination}
                    page={sopPage}
                    onPageChange={onSopPageChange}
                    isLoading={sopLoading}
                    isError={sopError}
                    isFetching={sopFetching}
                    showContextColumn={showContextColumn}
                    selectedDetailSopId={detailSopId}
                    onSelectSop={onSelectSop}
                    emptyTitle={sopEmptyTitle}
                    emptyHint={sopEmptyHint}
                    showSopSearchFilter={showSopSearchFilter}
                    sopSearch={sopSearch}
                    onSopSearchChange={onSopSearchChange}
                  />
                ) : (
                  <SopListPickProsesBisnisHint />
                )}
              </div>
            </CollapsibleSidePanelContent>
          </>
        )}
      </CollapsibleSidePanel>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface" aria-label="Pratinjau dokumen SOP">
        {detailSopId ? (
          <ArsipSopPreviewPane
            detailSopId={detailSopId}
            pdfUrl={selectedSop?.pdfUrl}
            title={selectedSop?.judul}
            contextName={selectedSopContext}
            onClose={onClosePreview}
            onRefresh={onRefreshPreview}
            variant="inline"
            embedded
          />
        ) : (
          <PreviewEmptyState
            showSopList={showSopList}
            hasManySops={(sopPagination?.totalItems ?? 0) > 10}
          />
        )}
      </section>
    </div>
  )
}

function SelectedProsesBisnisStrip({
  namaProsesBisnis,
  onChangeProsesBisnis,
}: {
  namaProsesBisnis: string
  onChangeProsesBisnis: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-subtle/80 px-2 py-2 sm:px-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <Workflow className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{namaProsesBisnis}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 shrink-0 px-2 text-xs text-blue-700 hover:bg-blue-50"
        onClick={onChangeProsesBisnis}
      >
        Ganti ProsesBisnis
      </Button>
    </div>
  )
}

function PreviewEmptyState({ showSopList, hasManySops }: { showSopList: boolean; hasManySops: boolean }) {
  return (
    <section className="flex h-full flex-col items-center justify-center p-8 text-center">
      <p className="text-base font-medium text-foreground">Pratinjau dokumen</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {showSopList
          ? hasManySops
            ? 'Pilih SOP di daftar kiri, atau gunakan filter di atas daftar.'
            : 'Pilih SOP di panel kiri untuk membaca dokumen di sini.'
          : 'Pilih Proses Bisnis di panel kiri, lalu pilih SOP untuk membuka pratinjau.'}
      </p>
    </section>
  )
}

function SopListPickProsesBisnisHint() {
  return <p className="p-4 text-center text-sm text-muted-foreground">Pilih ProsesBisnis untuk menampilkan daftar SOP.</p>
}
