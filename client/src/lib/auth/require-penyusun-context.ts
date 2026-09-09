import { redirect } from '@tanstack/react-router'
import { processContextApi } from '@/api/konteks-proses-bisnis'
import { processQueryKeys } from '@/config/kunci-query-proses-bisnis'
import { queryClient } from '@/config/query-client'
import { ROUTES } from '@/utils/constants'

export function requirePenyusunContext() {
  return async () => {
    if (typeof window === 'undefined') return

    const prosesBisnis = await queryClient.ensureQueryData({
      queryKey: processQueryKeys.mine,
      queryFn: processContextApi.mine,
    })

    if (prosesBisnis.length === 0) {
      throw redirect({ to: ROUTES.WORK_QUEUE })
    }
  }
}
