import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RouteErrorPage } from '@/components/ui/route-error'
import { requireAuthenticated } from '@/lib/auth/require-authenticated'

export const Route = createFileRoute('/work')({
  ssr: false,
  beforeLoad: requireAuthenticated(),
  component: DashboardLayout,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
