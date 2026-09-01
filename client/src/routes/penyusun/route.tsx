import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RouteErrorPage } from '@/components/ui/route-error'
import { requireAuthenticated } from '@/lib/auth/require-authenticated'

export const Route = createFileRoute('/penyusun')({
  // Protected dashboards hydrate auth from browser storage + HttpOnly cookie.
  // Rendering them on the Start server would execute authenticated queries without the user's cookie.
  ssr: false,
  beforeLoad: requireAuthenticated(),
  component: DashboardLayout,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
