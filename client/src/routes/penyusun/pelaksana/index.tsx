import { createFileRoute } from '@tanstack/react-router'
import { PelaksanaSOP } from '@/pages/penyusun/pelaksana/PelaksanaSOP'
import { requireRoles } from '@/stores/authStore'

export const Route = createFileRoute('/penyusun/pelaksana/')({
  beforeLoad: requireRoles(['PENYUSUN', 'PJ_PENYUSUN']),
  component: PelaksanaSOP,
})
