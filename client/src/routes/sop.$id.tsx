import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { requireProcessContext } from '@/lib/auth/require-capability'

const DetailSOPPenyusun = lazy(() =>
  import('@/pages/sop/detail/DetailSOPPenyusun').then((module) => ({
    default: module.DetailSOPPenyusun,
  })),
)

function DetailSOPPenyusunPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-secondary-foreground">
          Memuat workspace SOP…
        </div>
      }
    >
      <DetailSOPPenyusun />
    </Suspense>
  )
}

export const Route = createFileRoute('/sop/$id')({
  beforeLoad: requireProcessContext(),
  component: DetailSOPPenyusunPage,
})
