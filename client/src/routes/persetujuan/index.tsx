import { createFileRoute } from '@tanstack/react-router'
import { HalamanPersetujuanAkhirSOP } from '@/pages/persetujuan/HalamanPersetujuanAkhirSOP'

export const Route = createFileRoute('/persetujuan/')({
  component: HalamanPersetujuanAkhirSOP,
})
