import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'

/** Cache yang saling bergantung saat alur SOP Process berubah. */
export const SOP_WORKFLOW_QUERY_KEYS: readonly QueryKey[] = [
  queryKeys.sop,
  queryKeys.detailSop,
]

/**
 * Status alur dapat berubah dari akun atau tab lain. Cache tetap dipakai untuk
 * render awal, lalu data diperiksa ulang saat halaman dibuka atau tab aktif.
 */
export const SOP_WORKFLOW_REFRESH_OPTIONS = {
  staleTime: 0,
  refetchOnWindowFocus: true,
} as const

export async function invalidateSopWorkflow(
  queryClient: QueryClient,
  refetchType: 'active' | 'inactive' | 'all' | 'none' = 'active',
): Promise<void> {
  await Promise.all(
    SOP_WORKFLOW_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey, refetchType }),
    ),
  )
}
