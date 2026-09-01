CREATE TABLE `PengirimanNotifikasiWhatsApp` (
  `pengirimanNotifikasiWhatsAppId` CHAR(36) NOT NULL,
  `pengingatWhatsAppId` CHAR(36) NOT NULL,
  `pengajuanEvaluasiId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `jenis` ENUM(
    'EVALUASI_SOP',
    'TTD_BA_PJ_EVALUATOR',
    'TTD_BA_PJ_PENYUSUN',
    'TTD_SOP_KEPALA_OPD'
  ) NOT NULL,
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `transportMessageId` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `errorCode` VARCHAR(64) NULL,
  `submittedAt` DATETIME(3) NOT NULL,
  `resolvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`pengirimanNotifikasiWhatsAppId`),
  UNIQUE INDEX `PengirimanNotifikasiWhatsApp_idempotencyKey_key` (`idempotencyKey`),
  UNIQUE INDEX `PengirimanNotifikasiWhatsApp_transportMessageId_key` (`transportMessageId`),
  INDEX `PengirimanNotifikasi_identity_submitted_idx` (`pengajuanEvaluasiId`, `penggunaId`, `jenis`, `submittedAt`),
  INDEX `PengirimanNotifikasi_reminder_submitted_idx` (`pengingatWhatsAppId`, `submittedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WagoWebhookEvent` (
  `webhookId` VARCHAR(191) NOT NULL,
  `transportMessageId` VARCHAR(191) NOT NULL,
  `event` VARCHAR(64) NOT NULL,
  `status` VARCHAR(16) NOT NULL,
  `errorCode` VARCHAR(64) NULL,
  `sourceCreatedAt` DATETIME(3) NOT NULL,
  `receivedAt` DATETIME(3) NOT NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`webhookId`),
  INDEX `WagoWebhook_message_processed_idx` (`transportMessageId`, `processedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
