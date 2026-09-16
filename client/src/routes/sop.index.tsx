import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteErrorPage } from '@/components/ui/route-error'
import { queryClient } from '@/config/query-client'
import { queryKeys } from '@/config/query-keys'
import { sopApi } from '@/api/sop'
import { requireProcessContext } from '@/lib/auth/require-capability'

const ManajemenSOP = lazy(() =>
  import('@/pages/sop/ManajemenSOP').then((module) => ({
    default: module.ManajemenSOP,
  })),
)

export const Route = createFileRoute('/sop/')({
  beforeLoad: requireProcessContext(),
  loader: async () => {
    if (typeof window === 'undefined') return
    await queryClient.ensureQueryData({
      queryKey: queryKeys.sopList(),
      queryFn: () => sopApi.findAll(),
    })
  },
  component: ManajemenSOPPage,
  errorComponent: ({ error, reset }) => <RouteErrorPage error={error} reset={reset} />,
})

function ManajemenSOPPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-secondary-foreground">
          Memuat daftar SOP…
        </div>
      }
    >
      <ManajemenSOP />
    </Suspense>
  )
}
