import { createFileRoute } from '@tanstack/react-router'
import { ProcessApprovalPage } from '@/pages/approval/ProcessApprovalPage'

export const Route = createFileRoute('/approval/')({
  component: ProcessApprovalPage,
})
