import { createFileRoute } from '@tanstack/react-router'
import { ManajemenPeraturan } from '@/pages/peraturan/ManajemenPeraturan'
import { requireProcessContext } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/peraturan/')({
  beforeLoad: requireProcessContext(),
  component: ManajemenPeraturan,
})
