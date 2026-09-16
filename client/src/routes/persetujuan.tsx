import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RouteErrorPage } from '@/components/ui/route-error'
import { requireAuthenticated } from '@/lib/auth/require-authenticated'
import { requirePejabatBerwenang } from '@/lib/auth/require-work-capability'

export const Route = createFileRoute('/persetujuan')({
  ssr: false,
  beforeLoad: async (context) => {
    await requireAuthenticated()(context)
    await requirePejabatBerwenang()()
  },
  component: DashboardLayout,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
