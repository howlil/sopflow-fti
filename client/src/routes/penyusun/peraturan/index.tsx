import { createFileRoute } from '@tanstack/react-router'
import { ManajemenPeraturan } from '@/pages/penyusun/peraturan/ManajemenPeraturan'
import { requireAuthenticated } from '@/lib/auth/require-authenticated'

export const Route = createFileRoute('/penyusun/peraturan/')({
  beforeLoad: requireAuthenticated(),
  component: ManajemenPeraturan,
})
