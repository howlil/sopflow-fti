import { createFileRoute } from '@tanstack/react-router'
import { ProcessManagementPage } from '@/pages/work/ProcessManagementPage'

export const Route = createFileRoute('/work/processes')({
  component: ProcessManagementPage,
})
