import type { PaginationMetaDto } from '@/types/dto/common.dto'

type PaginatedEnvelope = {
  pagination?: PaginationMetaDto
}

/** Normalisasi respons terpaginasi (mendukung `pagination` baru dan `meta` lama). */
export function readPaginationMeta(
  data: PaginatedEnvelope | undefined,
): PaginationMetaDto | undefined {
  if (data === undefined) {
    return undefined
  }
  return data.pagination
}
