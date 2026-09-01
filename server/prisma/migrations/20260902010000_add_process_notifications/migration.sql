-- Target-native Process notification history is additive and intentionally
-- separate from legacy PengajuanEvaluasi/JenisPengingatWhatsApp persistence.
CREATE TABLE `ProcessNotification` (
  `processNotificationId` CHAR(36) NOT NULL,
  `detailSopId` CHAR(36) NOT NULL,
  `sopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `kind` ENUM('PROCESS_OWNER_REVIEW_REQUESTED', 'FINAL_APPROVAL_REQUESTED') NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `preview` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `actionHref` VARCHAR(255) NOT NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ProcessNotification_pengguna_read_created_idx` (`penggunaId`, `readAt`, `createdAt`),
  INDEX `ProcessNotification_detail_created_idx` (`detailSopId`, `createdAt`),
  INDEX `ProcessNotification_process_created_idx` (`processId`, `createdAt`),
  PRIMARY KEY (`processNotificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
