import { createFileRoute } from '@tanstack/react-router'
import { AccountManagementPage } from '@/pages/admin/AccountManagementPage'

export const Route = createFileRoute('/admin/accounts/')({
  component: AccountManagementPage,
})
