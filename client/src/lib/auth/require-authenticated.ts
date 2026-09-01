import { ROUTES } from '@/utils/constants'
import { ensureAuthHydrated, syncAuthFromCookie, useAuthStore } from '@/stores/authStore'

export function requireAuthenticated() {
  return async ({ location }: { location: { href: string } }) => {
    if (typeof window === 'undefined') return

    await ensureAuthHydrated()
    await syncAuthFromCookie()
    if (useAuthStore.getState().user) return

    const { redirect } = await import('@tanstack/react-router')
    throw redirect({
      to: ROUTES.AUTH.LOGIN,
      search: { redirect: location.href },
    })
  }
}
