import { z } from 'zod'

export const ARSIP_PROCESS_PAGE_SIZE = 50
/** Compatibility alias for legacy archive code that remains in the repository. */
export const ARSIP_OPD_PAGE_SIZE = ARSIP_PROCESS_PAGE_SIZE
export const ARSIP_SOP_PAGE_SIZE = 15
export const ARSIP_AUTO_SELECT_SOP_MAX = 10

export const arsipBrowseSearchSchema = z.object({
  processId: z.string().optional(),
  q: z.string().max(200).optional(),
  detailSopId: z.string().optional(),
  processPage: z.coerce.number().int().min(1).optional(),
  sopPage: z.coerce.number().int().min(1).optional(),
  sopSearch: z.string().max(200).optional(),
  // Accepted only so old bookmarked OPD-first URLs do not fail route validation.
  opdId: z.string().optional(),
  opdPage: z.coerce.number().int().min(1).optional(),
})

export type ArsipBrowseSearch = z.infer<typeof arsipBrowseSearchSchema>
