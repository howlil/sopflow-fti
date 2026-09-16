import { createFileRoute } from '@tanstack/react-router'
import { ArsipBrowsePage } from '@/pages/public/arsip/ArsipBrowsePage'
import { arsipBrowseSearchSchema } from '@/pages/public/arsip/arsip-search-schema'

export const Route = createFileRoute('/arsip/')({
  validateSearch: arsipBrowseSearchSchema,
  component: ArsipBrowsePage,
})
