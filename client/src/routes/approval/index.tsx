import { createFileRoute } from '@tanstack/react-router'
import { ProsesBisnisApprovalPage } from '@/pages/approval/ProsesBisnisApprovalPage'

export const Route = createFileRoute('/approval/')({
  component: ProsesBisnisApprovalPage,
})
