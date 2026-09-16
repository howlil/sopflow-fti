import { queryClient } from '@/config/query-client'
import { queryKeys } from '@/config/query-keys'
import { processQueryKeys } from '@/config/kunci-query-proses-bisnis'
import { authorityQueryKeys, organizationalAuthorityApi } from '@/api/pejabat-berwenang'
import { processContextApi } from '@/api/konteks-proses-bisnis'
import { processOwnerApi } from '@/api/penanggung-jawab-proses-bisnis'
import type { AuthUser } from '@/stores/authStore'
import { ROUTES } from '@/utils/constants'

async function readCapability<T>(queryKey: readonly unknown[], queryFn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await queryClient.ensureQueryData({ queryKey, queryFn })
  } catch {
    // A capability probe must never block authentication. The destination guard
    // remains the final authority when a probe is unavailable.
    return []
  }
}

/**
 * Resolves the first useful work surface for an authenticated actor.
 *
 * There is deliberately no neutral dashboard in this graph: identity and
 * contextual capability flow directly to the actor's business surface.
 */
export async function resolveAuthenticatedEntryPath(
  user: Pick<AuthUser, 'platformRole'>,
): Promise<string> {
  if (user.platformRole === 'SUPER_ADMIN') return ROUTES.ADMIN.ACCOUNTS

  const [ownedScopes, ownedProcesses, processContexts, authorities] = await Promise.all([
    readCapability(queryKeys.processOwnerScopes, processOwnerApi.scopes),
    readCapability(queryKeys.processOwnerProsesBisnises, processOwnerApi.prosesBisnis),
    readCapability(processQueryKeys.mine, processContextApi.mine),
    readCapability(authorityQueryKeys.mine, organizationalAuthorityApi.mine),
  ])

  if (ownedScopes.length > 0 || ownedProcesses.length > 0) {
    return ROUTES.PROSES_BISNIS
  }

  if (authorities.length > 0) return ROUTES.APPROVAL.INBOX
  if (processContexts.length > 0) return ROUTES.SOP

  // A newly provisioned account has no business context yet. Profile is the
  // only meaningful authenticated surface until Admin assigns one.
  return ROUTES.ME
}
