import { createFileRoute } from '@tanstack/react-router'
import { ProcessManagementPage } from '@/pages/admin/ProcessManagementPage'

export const Route = createFileRoute('/admin/processes/')({
  component: ProcessManagementPage,
})
