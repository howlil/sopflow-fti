import { createFileRoute } from '@tanstack/react-router'
import { ProsesBisnisManagementPage } from '@/pages/admin/ProsesBisnisManagementPage'

export const Route = createFileRoute('/admin/processes/')({
  component: ProsesBisnisManagementPage,
})
