import { redirect } from '@tanstack/react-router'
import { organizationalAuthorityApi, authorityQueryKeys } from '@/api/pejabat-berwenang'
import { processContextApi } from '@/api/konteks-proses-bisnis'
import { processQueryKeys } from '@/config/kunci-query-proses-bisnis'
import { queryClient } from '@/config/query-client'
import { queryKeys } from '@/config/query-keys'
import { processOwnerApi } from '@/api/penanggung-jawab-proses-bisnis'
import { resolveAuthenticatedEntryPath } from '@/lib/auth/resolve-entry-route'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils/constants'

type RouteLocation = { href: string }

async function redirectToActorEntry(location: RouteLocation): Promise<never> {
  const user = useAuthStore.getState().user
  const to = user ? await resolveAuthenticatedEntryPath(user) : ROUTES.ME
  throw redirect({ to, search: { denied: true, redirect: location.href } })
}

export function requireProcessContext() {
  return async ({ location }: { location: RouteLocation }) => {
    const prosesBisnis = await queryClient.ensureQueryData({
      queryKey: processQueryKeys.mine,
      queryFn: processContextApi.mine,
    })

    if (prosesBisnis.length === 0) {
      await redirectToActorEntry(location)
    }
  }
}

export function requireProcessOwnerContext() {
  return async ({ location }: { location: RouteLocation }) => {
    const [scopes, prosesBisnis] = await Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.processOwnerScopes,
        queryFn: processOwnerApi.scopes,
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.processOwnerProsesBisnises,
        queryFn: processOwnerApi.prosesBisnis,
      }),
    ])

    if (scopes.length === 0 && prosesBisnis.length === 0) {
      await redirectToActorEntry(location)
    }
  }
}

export function requireOrganizationalAuthority() {
  return async ({ location }: { location: RouteLocation }) => {
    const authorities = await queryClient.ensureQueryData({
      queryKey: authorityQueryKeys.mine,
      queryFn: organizationalAuthorityApi.mine,
    })

    if (authorities.length === 0) {
      await redirectToActorEntry(location)
    }
  }
}
