import { createFileRoute } from '@tanstack/react-router'
import { DetailSOPPenyusun } from '@/pages/penyusun/sop/detail/DetailSOPPenyusun'
import { requirePenyusunContext } from '@/lib/auth/require-penyusun-context'

export const Route = createFileRoute('/penyusun/sop/$id')({
  beforeLoad: requirePenyusunContext(),
  component: DetailSOPPenyusun,
})
