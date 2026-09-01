import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { STALE_TIME } from '@/utils/constants'

export interface GlobalPelaksana {
  id: string
  namaPelaksana: string
  createdBy: { id: string; nama: string } | null
  updatedBy: { id: string; nama: string } | null
  createdAt: string
  updatedAt: string
}

// Catalog identity is global; Process/SOP authorization is enforced by the SOP workflow boundary.
const pelaksanaApi = {
  list: () => unwrapApiData(apiClient.get<ApiSuccessResponse<GlobalPelaksana[]>>('/pelaksana')),
  create: (namaPelaksana: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<GlobalPelaksana>>('/pelaksana', { namaPelaksana }),
    ),
  update: (id: string, namaPelaksana: string) =>
    unwrapApiData(
      apiClient.patch<ApiSuccessResponse<GlobalPelaksana>>(`/pelaksana/${id}`, { namaPelaksana }),
    ),
  remove: (id: string) =>
    unwrapApiData(apiClient.delete<ApiSuccessResponse<null>>(`/pelaksana/${id}`)),
}

export function useGlobalPelaksana() {
  const query = useQuery({
    queryKey: queryKeys.pelaksana,
    queryFn: pelaksanaApi.list,
    staleTime: STALE_TIME.MEDIUM,
  })
  return { list: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useCreateGlobalPelaksana() {
  return useMutationWithToast({
    mutationFn: (namaPelaksana: string) => pelaksanaApi.create(namaPelaksana),
    invalidateKeys: [queryKeys.pelaksana],
    successMessage: 'Pelaksana berhasil ditambahkan ke katalog global',
    errorMessagePrefix: 'Gagal menambah pelaksana',
  })
}

export function useUpdateGlobalPelaksana() {
  return useMutationWithToast({
    mutationFn: ({ id, namaPelaksana }: { id: string; namaPelaksana: string }) =>
      pelaksanaApi.update(id, namaPelaksana),
    invalidateKeys: [queryKeys.pelaksana, queryKeys.sop],
    successMessage: 'Pelaksana berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui pelaksana',
  })
}

export function useDeleteGlobalPelaksana() {
  return useMutationWithToast({
    mutationFn: pelaksanaApi.remove,
    invalidateKeys: [queryKeys.pelaksana, queryKeys.sop],
    successMessage: 'Pelaksana berhasil dihapus',
    errorMessagePrefix: 'Gagal menghapus pelaksana',
  })
}
