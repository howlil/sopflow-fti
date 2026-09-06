import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginPage } from '@/pages/login/LoginPage'
import { RouteErrorPage } from '@/components/ui/route-error'
import { useAuthStore, ensureAuthHydrated, syncAuthFromCookie } from '@/stores/authStore'
import { redirectArgsFromAppPath, resolvePostLoginPath } from '@/utils/app-routing'
import { ROUTES } from '@/utils/constants'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login/')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    if (typeof window === 'undefined') return
    await ensureAuthHydrated()
    await syncAuthFromCookie()
    const user = useAuthStore.getState().user
    if (!user) return
    const path = search.redirect ? resolvePostLoginPath(search.redirect) : ROUTES.WORK
    throw redirect(redirectArgsFromAppPath(path))
  },
  component: LoginPage,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})
