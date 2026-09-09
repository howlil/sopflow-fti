import { createFileRoute } from '@tanstack/react-router'
import { requirePenanggungJawabProsesBisnis } from '@/lib/auth/require-work-capability'
import { ProcessManagementPage } from '@/pages/work/ProcessManagementPage'

export const Route = createFileRoute('/work/processes')({
  beforeLoad: requirePenanggungJawabProsesBisnis(),
  component: ProcessManagementPage,
})
