export type NotificationKind =
  | 'EVALUASI_SOP'
  | 'TTD_BA_PJ_EVALUATOR'
  | 'TTD_BA_PJ_PENYUSUN'
  | 'TTD_SOP_KEPALA_OPD'

export type ProcessNotificationKind =
  | 'PROCESS_OWNER_REVIEW_REQUESTED'
  | 'FINAL_APPROVAL_REQUESTED'
  | 'PROCESS_REVISION_REQUESTED'
  | 'PROCESS_SOP_EFFECTIVE'
  | 'PROCESS_SOP_REVOKED'

export type InAppNotificationDto = {
  pengajuanEvaluasiId: string
  jenis: NotificationKind
  title: string
  preview: string
  body: string
  readAt: string | null
  createdAt: string
}

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

export type NotificationItem =
  | ({ source: 'LEGACY' } & InAppNotificationDto)
  | ({ source: 'PROCESS' } & ProcessInAppNotificationDto)

export type NotificationSummaryDto = {
  unreadCount: number
}
