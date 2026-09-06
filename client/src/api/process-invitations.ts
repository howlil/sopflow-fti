import { apiClient } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type { ProcessInvitationPreviewDto, ProcessAssignableUserDto } from '@/types/dto/process.dto'

export const processInvitationApi = {
  preview: (token: string): Promise<ProcessInvitationPreviewDto> =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProcessInvitationPreviewDto>>(`/process-invitations/${token}`),
    ),
  accept: (token: string, password: string): Promise<ProcessAssignableUserDto> =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<ProcessAssignableUserDto>>(`/process-invitations/${token}/accept`, {
        password,
      }),
    ),
}
