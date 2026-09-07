import { createFileRoute } from '@tanstack/react-router'
import { HalamanPersetujuanAkhirSOP } from '@/pages/approval/HalamanPersetujuanAkhirSOP'

export const Route = createFileRoute('/approval/')({
  component: HalamanPersetujuanAkhirSOP,
})
