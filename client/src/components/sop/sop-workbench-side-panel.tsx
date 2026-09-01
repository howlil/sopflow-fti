import { FileText } from 'lucide-react'
import {
  CollapsedStripButton,
  CollapsibleSidePanel,
  CollapsibleSidePanelContent,
  CollapsibleSidePanelHeader,
  SimplePanelHeader,
} from '@/components/ui/collapsible-side-panel'
import { cn } from '@/utils/cn'
import { SOPListCard, type SOPListItem } from './sop-list-card'

export interface SopWorkbenchSidePanelProps {
  collapsed: boolean
  onCollapse: () => void
  onExpand: () => void
  items: SOPListItem[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  title?: string
  className?: string
}

export function SopWorkbenchSidePanel({
  collapsed,
  onCollapse,
  onExpand,
  items,
  selectedId = null,
  onSelect,
  title = 'Daftar SOP',
  className,
}: SopWorkbenchSidePanelProps) {
  return (
    <div
      data-testid="sop-workbench-side-panel"
      className={cn(
        'flex h-full flex-shrink-0 transition-[width] duration-200 motion-reduce:transition-none',
        collapsed ? 'w-10' : 'w-[min(340px,36vw)]',
        className,
      )}
    >
      <CollapsibleSidePanel
        side="left"
        collapsed={collapsed}
        widthCollapsed="w-full"
        widthExpanded="w-full"
        className="min-w-0 flex-1"
      >
        {collapsed ? (
          <CollapsedStripButton
            label="SOP"
            icon={<FileText className="h-4 w-4" />}
            onClick={onExpand}
          />
        ) : (
          <>
            <CollapsibleSidePanelHeader
              side="left"
              onCollapse={onCollapse}
              className="border-border bg-surface px-2.5 py-2 sm:px-3"
            >
              <SimplePanelHeader title={title} subtitle={`${items.length} dokumen`} />
            </CollapsibleSidePanelHeader>
            <CollapsibleSidePanelContent className="py-1">
              <SOPListCard
                variant="compact"
                items={items}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            </CollapsibleSidePanelContent>
          </>
        )}
      </CollapsibleSidePanel>
    </div>
  )
}
