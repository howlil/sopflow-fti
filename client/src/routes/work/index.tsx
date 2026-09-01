import { createFileRoute } from '@tanstack/react-router'
import { WorkHomePage } from '@/pages/work/WorkHomePage'

export const Route = createFileRoute('/work/')({
  component: WorkHomePage,
})
