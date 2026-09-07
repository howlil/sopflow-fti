import { resolveApiBaseUrl } from '@/config/env'
import { apiClient, buildQueryString } from '@/lib/api/api-client'
import { unwrapApiData } from '@/lib/api/response'
import type { ApiSuccessResponse } from '@/types/dto/auth.dto'
import type {
  NotificationSummaryDto,
  ProsesBisnisInAppNotificationDto,
} from '@/types/dto/notifications.dto'

export const notificationApi = {
  processSummary: () =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<NotificationSummaryDto>>('/notifications/process/summary'),
    ),

  processList: (limit = 10) =>
    unwrapApiData(
      apiClient.get<ApiSuccessResponse<ProsesBisnisInAppNotificationDto[]>>(
        `/notifications/process${buildQueryString({ limit })}`,
      ),
    ),

  markProsesBisnisRead: (notifikasiProsesBisnisId: string) =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<NotificationSummaryDto>>(
        `/notifications/process/items/${encodeURIComponent(notifikasiProsesBisnisId)}/read`,
      ),
    ),

  markAllProsesBisnisRead: () =>
    unwrapApiData(
      apiClient.post<ApiSuccessResponse<NotificationSummaryDto & { updated: number }>>(
        '/notifications/process/read-all',
      ),
    ),
}

export function resolveNotificationStreamUrl(): string {
  return `${resolveApiBaseUrl()}/notifications/process/stream`
}
