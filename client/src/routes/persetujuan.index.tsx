import { createFileRoute } from '@tanstack/react-router'
import { HalamanSiklusSOP } from '@/pages/persetujuan/HalamanSiklusSOP'
import { requireOrganizationalAuthority } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/persetujuan/')({
  beforeLoad: requireOrganizationalAuthority(),
  component: HalamanSiklusSOP,
})
