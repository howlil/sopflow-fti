/** Peraturan API service — global FTI catalog. */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData, unwrapApiVoid } from '@/lib/api/response'
import { queryKeys } from '@/config/query-keys'
import { useMutationWithToast } from '@/hooks/useMutationWithToast'
import { STALE_TIME } from '@/utils/constants'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  CreatePeraturanDto,
  PeraturanResponse,
  UpdatePeraturanDto,
  UpdatePeraturanMutationDto,
} from '@/types/dto/peraturan.dto'

export const peraturanApi = {
  findAll: (): Promise<PeraturanResponse[]> =>
    unwrapApiData(apiClient.get<ApiSuccessResponse<PeraturanResponse[]>>('/peraturan')),

  create: (payload: CreatePeraturanDto): Promise<PeraturanResponse> =>
    unwrapApiData(apiClient.post<ApiSuccessResponse<PeraturanResponse>>('/peraturan', payload)),

  update: (id: string, payload: UpdatePeraturanDto): Promise<PeraturanResponse> =>
    unwrapApiData(apiClient.patch<ApiSuccessResponse<PeraturanResponse>>(`/peraturan/${id}`, payload)),

  delete: async (id: string): Promise<void> => {
    await unwrapApiVoid(apiClient.delete<ApiSuccessResponse<null>>(`/peraturan/${id}`))
  },
}

export function usePeraturan() {
  const {
    data: list = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.peraturanList,
    queryFn: peraturanApi.findAll,
    staleTime: STALE_TIME.MEDIUM,
  })

  const createMutation = useMutationWithToast({
    mutationFn: (payload: CreatePeraturanDto) => peraturanApi.create(payload),
    invalidateKeys: [queryKeys.peraturan, queryKeys.sop],
    successMessage: 'Peraturan berhasil ditambahkan',
    errorMessagePrefix: 'Gagal menambahkan peraturan',
  })

  const updateMutation = useMutationWithToast({
    mutationFn: ({ id, payload }: UpdatePeraturanMutationDto) => peraturanApi.update(id, payload),
    invalidateKeys: [queryKeys.peraturan, queryKeys.sop],
    successMessage: 'Peraturan berhasil diperbarui',
    errorMessagePrefix: 'Gagal memperbarui peraturan',
  })

  const deleteMutation = useMutationWithToast({
    mutationFn: (id: string) => peraturanApi.delete(id),
    invalidateKeys: [queryKeys.peraturan, queryKeys.sop],
    successMessage: 'Peraturan berhasil dihapus',
    errorMessagePrefix: 'Gagal menghapus peraturan',
  })

  return {
    list,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
