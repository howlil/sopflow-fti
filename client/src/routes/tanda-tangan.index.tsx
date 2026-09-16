import { createFileRoute } from '@tanstack/react-router'
import { HalamanTandaTanganSOP } from '@/pages/tanda-tangan/HalamanTandaTanganSOP'
import { requireOrganizationalAuthority } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/tanda-tangan/')({
  beforeLoad: requireOrganizationalAuthority(),
  component: HalamanTandaTanganSOP,
})
