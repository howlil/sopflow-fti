export type ProcessNotificationKind =
  | 'PROCESS_OWNER_REVIEW_REQUESTED'
  | 'FINAL_APPROVAL_REQUESTED'
  | 'PROCESS_REVISION_REQUESTED'
  | 'PROCESS_SOP_EFFECTIVE'
  | 'PROCESS_SOP_REVOKED'

export type ProcessInAppNotificationDto = {
  processNotificationId: string
  kind: ProcessNotificationKind
  title: string
  preview: string
  body: string
  actionHref: '/work/queue' | '/approval'
  readAt: string | null
  createdAt: string
}

export type NotificationItem = { source: 'PROCESS' } & ProcessInAppNotificationDto

export type NotificationSummaryDto = {
  unreadCount: number
}
