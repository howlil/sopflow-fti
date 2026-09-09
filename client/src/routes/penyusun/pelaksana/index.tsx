import { createFileRoute } from '@tanstack/react-router'
import { requireProsesBisnisResponsibility } from '@/lib/auth/require-work-capability'
import { PelaksanaSOP } from '@/pages/penyusun/pelaksana/PelaksanaSOP'

export const Route = createFileRoute('/penyusun/pelaksana/')({
  beforeLoad: requireProsesBisnisResponsibility(),
  component: PelaksanaSOP,
})
