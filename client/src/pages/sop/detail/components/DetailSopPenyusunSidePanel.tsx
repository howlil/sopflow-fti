import { useEffect } from 'react'
import { History, MessageSquare, PenLine } from 'lucide-react'
import {
  CollapsedStripButton,
  CollapsibleSidePanel,
  CollapsibleSidePanelContent,
  CollapsibleSidePanelHeader,
  PanelTabStrip,
} from '@/components/ui/collapsible-side-panel'
import { RiwayatVersiPanel } from '@/pages/sop/components/RiwayatVersiPanel'
import { DetailSOPMetadataPanel } from './DetailSopMetadataPanel'
import { DetailSopReviewPanel } from './DetailSopReviewPanel'
import type { SopRiwayatVersiRow } from '@/types/dto/sop.dto'

export interface DetailSOPPenyusunSidePanelProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  rightPanelTab: 'edit' | 'versi' | 'review'
  onTabChange: (tab: 'edit' | 'versi' | 'review') => void
  /** @deprecated Label metadata sekarang diturunkan dari mode read-only. */
  editTabLabel?: string
  isReadOnly?: boolean
  canReview?: boolean
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
  isReadOnly = false,
  canReview = false,
  detailSopId,
  sopId,
  onBuatVersiBaru,
  isBuatVersiBaruPending = false,
  buatVersiBaruBlockingReason = null,
}: DetailSOPPenyusunSidePanelProps) {
  const propertyLabel = isReadOnly ? 'Informasi' : 'Properti'
  const tabs = [
    ...(canReview
      ? [{ id: 'review', label: 'Pemeriksaan', icon: <MessageSquare className="h-3.5 w-3.5" />, badge: '!' }]
      : []),
    { id: 'edit', label: propertyLabel, icon: <PenLine className="h-3.5 w-3.5" /> },
    { id: 'versi', label: 'Versi', icon: <History className="h-3.5 w-3.5" /> },
  ]

  useEffect(() => {
    if (!canReview && rightPanelTab === 'review') onTabChange('edit')
  }, [canReview, onTabChange, rightPanelTab])

  return (
    <CollapsibleSidePanel
      side="right"
      collapsed={collapsed}
      widthCollapsed="w-10"
      widthExpanded="w-full"
    >
      {collapsed ? (
        <CollapsedStripButton
          label={canReview ? 'Pemeriksaan SOP' : propertyLabel}
          icon={tabs[0].icon}
          onClick={() => onCollapsedChange(false)}
        />
      ) : (
        <>
          <CollapsibleSidePanelHeader side="right" onCollapse={() => onCollapsedChange(true)}>
            <PanelTabStrip
              tabs={tabs}
              activeTab={rightPanelTab}
              onTabChange={(tab) => onTabChange(tab as DetailSOPPenyusunSidePanelProps['rightPanelTab'])}
            />
          </CollapsibleSidePanelHeader>
          <CollapsibleSidePanelContent className="px-0 pb-2 pt-1">
            {rightPanelTab === 'review' && canReview ? (
              <DetailSopReviewPanel detailSopId={detailSopId} canReview={canReview} />
            ) : null}
            {rightPanelTab === 'edit' && <DetailSOPMetadataPanel />}
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
          </CollapsibleSidePanelContent>
        </>
      )}
    </CollapsibleSidePanel>
  )
}
