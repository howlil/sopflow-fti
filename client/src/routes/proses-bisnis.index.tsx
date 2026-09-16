import { createFileRoute } from '@tanstack/react-router'
import { ProcessManagementPage } from '@/pages/work/ProcessManagementPage'
import { requireProcessOwnerContext } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/proses-bisnis/')({
  beforeLoad: requireProcessOwnerContext(),
  component: ProcessManagementPage,
})
