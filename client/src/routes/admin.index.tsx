import { createFileRoute } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'
import { ROUTES } from '@/utils/constants'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.ADMIN.ACCOUNTS })
  },
})
