import { createFileRoute } from '@tanstack/react-router'
import { HalamanPengelolaanProsesBisnis } from '@/pages/admin/HalamanPengelolaanProsesBisnis'

export const Route = createFileRoute('/admin/processes/')({
  component: HalamanPengelolaanProsesBisnis,
})
