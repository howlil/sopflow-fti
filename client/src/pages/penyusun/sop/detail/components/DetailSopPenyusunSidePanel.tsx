import { PenLine, MessageSquare, Activity, History } from 'lucide-react'
import {
  CollapsedStripButton,
  CollapsibleSidePanel,
  CollapsibleSidePanelContent,
  CollapsibleSidePanelHeader,
  PanelTabStrip,
} from '@/components/ui/collapsible-side-panel'
import { UmpanBalikEvaluasiPanel } from '@/pages/penyusun/sop/components/UmpanBalikEvaluasiPanel'
import type { UmpanBalikEvaluasiDetail } from '@/types/dto/evaluasi.dto'
import { RiwayatStatusPanel } from '@/pages/penyusun/sop/components/RiwayatStatusPanel'
import { RiwayatVersiPanel } from '@/pages/penyusun/sop/components/RiwayatVersiPanel'
import { DetailSOPMetadataPanel } from './DetailSopMetadataPanel'
import type { PenyusunWorkbenchLogEdit, SopRiwayatVersiRow } from '@/types/dto/sop.dto'

export interface DetailSOPPenyusunSidePanelProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  rightPanelTab: 'edit' | 'komentar' | 'versi' | 'aktivitas'
  onTabChange: (tab: 'edit' | 'komentar' | 'versi' | 'aktivitas') => void
  auditEntries: PenyusunWorkbenchLogEdit[]
  /** @deprecated Label metadata sekarang diturunkan dari mode read-only. */
  editTabLabel?: string
  umpanBalik?: UmpanBalikEvaluasiDetail | null
  isUmpanBalikLoading?: boolean
  isReadOnly?: boolean
  detailSopId: string
  sopId?: string
  onBuatVersiBaru?: (source: SopRiwayatVersiRow) => void
  isBuatVersiBaruPending?: boolean
  buatVersiBaruBlockingReason?: string | null
}

export function DetailSOPPenyusunSidePanel({
  collapsed,
  onCollapsedChange,
  rightPanelTab,
  onTabChange,
  auditEntries = [],
  umpanBalik = null,
  isUmpanBalikLoading = false,
  isReadOnly = false,
  detailSopId,
  sopId,
  onBuatVersiBaru,
  isBuatVersiBaruPending = false,
  buatVersiBaruBlockingReason = null,
}: DetailSOPPenyusunSidePanelProps) {
  const propertyLabel = isReadOnly ? 'Informasi' : 'Properti'
  const tabs = [
    { id: 'edit', label: propertyLabel, icon: <PenLine className="h-3.5 w-3.5" /> },
    { id: 'komentar', label: 'Komentar evaluasi', icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: 'versi', label: 'Versi', icon: <History className="h-3.5 w-3.5" /> },
    { id: 'aktivitas', label: 'Aktivitas', icon: <Activity className="h-3.5 w-3.5" /> },
  ]

  return (
    <CollapsibleSidePanel
      side="right"
      collapsed={collapsed}
      widthCollapsed="w-10"
      widthExpanded="w-full"
    >
      {collapsed ? (
        <CollapsedStripButton
          label={propertyLabel}
          icon={tabs[0].icon}
          onClick={() => onCollapsedChange(false)}
        />
      ) : (
        <>
          <CollapsibleSidePanelHeader side="right" onCollapse={() => onCollapsedChange(true)}>
            <PanelTabStrip
              tabs={tabs}
              activeTab={rightPanelTab}
              onTabChange={(tab) =>
                onTabChange(tab as DetailSOPPenyusunSidePanelProps['rightPanelTab'])
              }
            />
          </CollapsibleSidePanelHeader>
          <CollapsibleSidePanelContent className="px-0 pb-2 pt-1">
            {rightPanelTab === 'edit' && <DetailSOPMetadataPanel />}
            {rightPanelTab === 'komentar' && (
              <div className="flex min-h-0 flex-1 flex-col px-2">
                <div className="min-h-0 flex-1">
                  <UmpanBalikEvaluasiPanel
                    umpanBalik={umpanBalik}
                    isLoading={isUmpanBalikLoading}
                  />
                </div>
              </div>
            )}
            {rightPanelTab === 'versi' && sopId ? (
              <div className="px-2">
                <RiwayatVersiPanel
                  sopId={sopId}
                  activeDetailSopId={detailSopId}
                  isReadOnly={isReadOnly}
                  onBuatVersiBaru={onBuatVersiBaru}
                  isBuatVersiBaruPending={isBuatVersiBaruPending}
                  buatVersiBaruBlockingReason={buatVersiBaruBlockingReason}
                />
              </div>
            ) : null}
            {rightPanelTab === 'aktivitas' && (
              <div className="p-3">
                <RiwayatStatusPanel entries={auditEntries} />
              </div>
            )}
          </CollapsibleSidePanelContent>
        </>
      )}
    </CollapsibleSidePanel>
  )
}
