-- Additive native reminder state for Process-bound SOP workflow.
-- ProcessNotification remains the in-app event/read history; this table owns
-- mutable delivery, retry, and lock state. Legacy PengingatWhatsApp remains
-- untouched during EXPAND/CUTOVER.

CREATE TABLE `ProcessReminder` (
  `processReminderId` CHAR(36) NOT NULL,
  `detailSopId` CHAR(36) NOT NULL,
  `sopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `kind` ENUM('PROCESS_OWNER_REVIEW', 'PROCESS_REVISION', 'FINAL_APPROVAL', 'TTE') NOT NULL,
  `destinationPhone` VARCHAR(13) NOT NULL,
  `nextSendAt` DATETIME(3) NOT NULL,
  `lastSentAt` DATETIME(3) NULL,
  `consecutiveFailures` INT NOT NULL DEFAULT 0,
  `lastErrorKind` VARCHAR(64) NULL,
  `lockedUntil` DATETIME(3) NULL,
  `lockToken` CHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`processReminderId`),
  UNIQUE INDEX `ProcessReminder_detail_recipient_kind_key` (`detailSopId`, `penggunaId`, `kind`),
  INDEX `ProcessReminder_due_lock_idx` (`nextSendAt`, `lockedUntil`),
  INDEX `ProcessReminder_process_created_idx` (`processId`, `createdAt`),
  INDEX `ProcessReminder_recipient_created_idx` (`penggunaId`, `createdAt`),
  CONSTRAINT `ProcessReminder_detailSopId_fkey`
    FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReminder_sopId_fkey`
    FOREIGN KEY (`sopId`) REFERENCES `SOP`(`sopId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReminder_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReminder_penggunaId_fkey`
    FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
