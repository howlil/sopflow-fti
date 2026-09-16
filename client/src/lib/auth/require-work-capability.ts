import { redirect } from '@tanstack/react-router'
import { processContextApi } from '@/api/konteks-proses-bisnis'
import { organizationalAuthorityApi } from '@/api/pejabat-berwenang'
import { processOwnerApi } from '@/api/penanggung-jawab-proses-bisnis'
import { ROUTES } from '@/utils/constants'

/**
 * Frontend guards mirror backend capability boundaries for navigation/deep links.
 * Backend authorization remains the security authority for every mutation/read.
 */
export function requireProsesBisnisResponsibility() {
  return async () => {
    if (typeof window === 'undefined') return
    const prosesBisnis = await processContextApi.mine()
    if (prosesBisnis.length === 0) throw redirect({ to: ROUTES.WORK })
  }
}

export function requirePenanggungJawabProsesBisnis() {
  return async () => {
    if (typeof window === 'undefined') return
    const [scopes, prosesBisnis] = await Promise.all([
      processOwnerApi.scopes(),
      processOwnerApi.prosesBisnis(),
    ])
    if (scopes.length === 0 && prosesBisnis.length === 0) {
      throw redirect({ to: ROUTES.WORK })
    }
  }
}

export function requirePejabatBerwenang() {
  return async () => {
    if (typeof window === 'undefined') return
    const assignments = await organizationalAuthorityApi.mine()
    if (assignments.length === 0) throw redirect({ to: ROUTES.WORK })
  }
}
