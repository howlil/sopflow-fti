export type JenisNotifikasiProsesBisnis =
  | 'PROCESS_OWNER_REVIEW_REQUESTED'
  | 'FINAL_APPROVAL_REQUESTED'
  | 'PROCESS_REVISION_REQUESTED'
  | 'PROCESS_SOP_EFFECTIVE'
  | 'PROCESS_SOP_REVOKED'

export type ProsesBisnisInAppNotificationDto = {
  notifikasiProsesBisnisId: string
  kind: JenisNotifikasiProsesBisnis
  title: string
  preview: string
  body: string
  actionHref: '/work/queue' | '/persetujuan'
  readAt: string | null
  createdAt: string
}

export type NotificationItem = { source: 'PROCESS' } & ProsesBisnisInAppNotificationDto

export type NotificationSummaryDto = {
  unreadCount: number
}
