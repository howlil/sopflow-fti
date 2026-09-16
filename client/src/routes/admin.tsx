import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RouteErrorPage } from '@/components/ui/route-error'
import { requirePlatformRole } from '@/stores/authStore'

export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: requirePlatformRole('SUPER_ADMIN'),
  component: DashboardLayout,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
