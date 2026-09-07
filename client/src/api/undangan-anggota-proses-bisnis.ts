import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { UndanganAnggotaProsesBisnisPreviewDto, ProsesBisnisAssignableUserDto } from '@/types/dto/proses-bisnis.dto'

export const undanganAnggotaProsesBisnisApi = {
  preview: (token: string): Promise<UndanganAnggotaProsesBisnisPreviewDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<UndanganAnggotaProsesBisnisPreviewDto>>(`/undangan-anggota-proses-bisnis/${token}`),
    ),
  accept: (token: string, password: string): Promise<ProsesBisnisAssignableUserDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProsesBisnisAssignableUserDto>>(`/undangan-anggota-proses-bisnis/${token}/accept`, {
        password,
      }),
    ),
}
