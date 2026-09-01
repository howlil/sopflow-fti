import { createFileRoute } from '@tanstack/react-router'
import { ManajemenPeraturan } from '@/pages/penyusun/peraturan/ManajemenPeraturan'
import { requireRoles } from '@/stores/authStore'

export const Route = createFileRoute('/penyusun/peraturan/')({
  beforeLoad: requireRoles(['PENYUSUN', 'PJ_PENYUSUN']),
  component: ManajemenPeraturan,
})
