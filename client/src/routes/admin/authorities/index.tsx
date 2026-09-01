import { createFileRoute } from '@tanstack/react-router'
import { AuthorityManagementPage } from '@/pages/admin/AuthorityManagementPage'

export const Route = createFileRoute('/admin/authorities/')({
  component: AuthorityManagementPage,
})
