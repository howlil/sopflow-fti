import { createFileRoute } from '@tanstack/react-router'
import { ProsesBisnisWorkQueuePage } from '@/pages/work/ProsesBisnisWorkQueuePage'

export const Route = createFileRoute('/work/queue')({
  component: ProsesBisnisWorkQueuePage,
})
