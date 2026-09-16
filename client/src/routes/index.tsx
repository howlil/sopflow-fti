import { lazy, Suspense, useEffect } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { RouteErrorPage } from '@/components/ui/route-error'
import { resolveAuthenticatedEntryPath } from '@/lib/auth/resolve-entry-route'
import { ensureAuthHydrated, syncAuthFromCookie, useAuthStore } from '@/stores/authStore'

const homeSearchSchema = z.object({
  denied: z.coerce.boolean().optional(),
  redirect: z.string().max(2048).optional(),
})

const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)

function HomeRoutePage() {
  useEffect(() => {
    let active = true
    void syncAuthFromCookie().then((authenticated) => {
      if (!active || !authenticated) return
      const user = useAuthStore.getState().user
      if (!user) return
      void resolveAuthenticatedEntryPath(user).then((path) => window.location.assign(path))
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
          <div className="text-center text-sm text-secondary-foreground">Memuat beranda…</div>
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  )
}

export const Route = createFileRoute('/')({
  validateSearch: homeSearchSchema,
  beforeLoad: async () => {
    await ensureAuthHydrated()
    const user = useAuthStore.getState().user
    if (user) throw redirect({ to: await resolveAuthenticatedEntryPath(user) })
  },
  component: HomeRoutePage,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
