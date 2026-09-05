/** Metadata pagination bersama seluruh list API. */
export interface PaginationMetaDto {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}
