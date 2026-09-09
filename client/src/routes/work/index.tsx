import { createFileRoute, redirect } from '@tanstack/react-router'
import { processContextApi } from '@/api/konteks-proses-bisnis'
import { organizationalAuthorityApi } from '@/api/pejabat-berwenang'
import { processOwnerApi } from '@/api/penanggung-jawab-proses-bisnis'
import { WorkHomePage } from '@/pages/work/WorkHomePage'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/utils/constants'

export const Route = createFileRoute('/work/')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return

    const [prosesBisnis, ownerScopes, authorities] = await Promise.all([
      processContextApi.mine(),
      processOwnerApi.scopes(),
      organizationalAuthorityApi.mine(),
    ])

    if (prosesBisnis.length > 0) throw redirect({ to: ROUTES.WORK_QUEUE })
    if (ownerScopes.length > 0) throw redirect({ to: ROUTES.WORK_PROCESSES })
    if (authorities.length > 0) throw redirect({ to: ROUTES.APPROVAL.INBOX })
    if (useAuthStore.getState().user?.platformRole === 'SUPER_ADMIN') {
      throw redirect({ to: ROUTES.ADMIN.HOME })
    }
  },
  component: WorkHomePage,
})
