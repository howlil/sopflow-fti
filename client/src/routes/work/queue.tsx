import { createFileRoute } from '@tanstack/react-router'
import { ProcessWorkQueuePage } from '@/pages/work/ProcessWorkQueuePage'

export const Route = createFileRoute('/work/queue')({
  component: ProcessWorkQueuePage,
})
