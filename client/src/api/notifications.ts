import { resolveApiBaseUrl } from '@/config/env'
import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  InAppNotificationDto,
  NotificationKind,
  NotificationSummaryDto,
} from '@/types/dto/notifications.dto'

export const notificationApi = {
  summary: () =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<NotificationSummaryDto>>('/notifications/summary'),
    ),

  list: (limit = 10) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<InAppNotificationDto[]>>(
        `/notifications${buildQueryString({ limit })}`,
      ),
    ),

  markRead: (pengajuanEvaluasiId: string, jenis: NotificationKind) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<NotificationSummaryDto>>(
        `/notifications/${encodeURIComponent(pengajuanEvaluasiId)}/${encodeURIComponent(jenis)}/read`,
      ),
    ),

  markAllRead: () =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<NotificationSummaryDto & { updated: number }>>(
        '/notifications/read-all',
      ),
    ),
}

export function resolveNotificationStreamUrl(): string {
  return `${resolveApiBaseUrl()}/notifications/stream`
}
