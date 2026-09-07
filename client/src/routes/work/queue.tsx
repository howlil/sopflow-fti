import { createFileRoute } from '@tanstack/react-router'
import { HalamanAntrianKerjaProsesBisnis } from '@/pages/work/HalamanAntrianKerjaProsesBisnis'

export const Route = createFileRoute('/work/queue')({
  component: HalamanAntrianKerjaProsesBisnis,
})
