import { createFileRoute } from '@tanstack/react-router'
import { HalamanPersetujuanAkhirSOP } from '@/pages/persetujuan/HalamanPersetujuanAkhirSOP'
import { requireOrganizationalAuthority } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/persetujuan/')({
  beforeLoad: requireOrganizationalAuthority(),
  component: HalamanPersetujuanAkhirSOP,
})
