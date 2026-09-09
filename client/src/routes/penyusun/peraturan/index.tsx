import { createFileRoute } from '@tanstack/react-router'
import { requireProsesBisnisResponsibility } from '@/lib/auth/require-work-capability'
import { ManajemenPeraturan } from '@/pages/penyusun/peraturan/ManajemenPeraturan'

export const Route = createFileRoute('/penyusun/peraturan/')({
  beforeLoad: requireProsesBisnisResponsibility(),
  component: ManajemenPeraturan,
})
