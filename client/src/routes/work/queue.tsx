import { createFileRoute } from '@tanstack/react-router'
import { requireProsesBisnisResponsibility } from '@/lib/auth/require-work-capability'
import { HalamanAntrianKerjaProsesBisnis } from '@/pages/work/HalamanAntrianKerjaProsesBisnis'

export const Route = createFileRoute('/work/queue')({
  beforeLoad: requireProsesBisnisResponsibility(),
  component: HalamanAntrianKerjaProsesBisnis,
})
