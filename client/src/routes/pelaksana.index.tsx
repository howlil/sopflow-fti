import { createFileRoute } from '@tanstack/react-router'
import { PelaksanaSOP } from '@/pages/pelaksana/PelaksanaSOP'
import { requireProcessContext } from '@/lib/auth/require-capability'

export const Route = createFileRoute('/pelaksana/')({
  beforeLoad: requireProcessContext(),
  component: PelaksanaSOP,
})
