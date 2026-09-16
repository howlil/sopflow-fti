import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { LoginPage } from '@/pages/login/LoginPage'
import { RouteErrorPage } from '@/components/ui/route-error'
import { resolveAuthenticatedEntryPath } from '@/lib/auth/resolve-entry-route'
import { useAuthStore, ensureAuthHydrated, syncAuthFromCookie } from '@/stores/authStore'
import { redirectArgsFromAppPath, resolvePostLoginPath } from '@/utils/app-routing'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

function LoginRoutePage() {
  useEffect(() => {
    let active = true
    void syncAuthFromCookie().then((authenticated) => {
      if (!active || !authenticated) return
      const requestedPath = new URLSearchParams(window.location.search).get('redirect')
      const user = useAuthStore.getState().user
      if (!user) return
      void resolveAuthenticatedEntryPath(user).then((defaultPath) => {
        const target = requestedPath
          ? resolvePostLoginPath(requestedPath, defaultPath)
          : defaultPath
        window.location.assign(target)
      })
    })
    return () => {
      active = false
    }
  }, [])

  return <LoginPage />
}

export const Route = createFileRoute('/login/')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    if (typeof window === 'undefined') return
    await ensureAuthHydrated()
    const user = useAuthStore.getState().user
    if (!user) return
    const defaultPath = await resolveAuthenticatedEntryPath(user)
    const path = search.redirect ? resolvePostLoginPath(search.redirect, defaultPath) : defaultPath
    throw redirect(redirectArgsFromAppPath(path))
  },
  component: LoginRoutePage,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
