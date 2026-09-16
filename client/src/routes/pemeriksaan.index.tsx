import { createFileRoute } from '@tanstack/react-router'
import { requireProcessOwnerContext } from '@/lib/auth/require-capability'
import { HalamanPemeriksaanProsesBisnis } from '@/pages/pemeriksaan/HalamanPemeriksaanProsesBisnis'

export const Route = createFileRoute('/pemeriksaan/')({
  beforeLoad: requireProcessOwnerContext(),
  component: HalamanPemeriksaanProsesBisnis,
})
