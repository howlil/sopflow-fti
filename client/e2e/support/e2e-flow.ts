import type { APIRequestContext } from '@playwright/test'
import { apiGet, apiPost } from './api'
import { e2ePin } from './test-data'

/** Ensure an FTI identity has usable TTE credentials; authority comes from Process scope, not this profile. */
export async function ensureTteReady(context: APIRequestContext): Promise<void> {
  const profil = await apiGet<unknown | null>(context, '/tte/profil')
  if (profil !== null) return
  await apiPost(context, '/tte/profil/setup/generate', { pin: e2ePin })
}
