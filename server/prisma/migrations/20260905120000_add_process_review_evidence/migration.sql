-- Additive native Process Owner review evidence.
-- Review evidence is separate from legacy PengajuanEvaluasi/NilaiEvaluasi history.

CREATE TABLE `ProcessReview` (
  `processReviewId` CHAR(36) NOT NULL,
  `detailSopId` CHAR(36) NOT NULL,
  `sopId` CHAR(36) NOT NULL,
  `processId` CHAR(36) NOT NULL,
  `reviewedById` CHAR(36) NOT NULL,
  `decision` ENUM('REVISION', 'ACCEPT') NOT NULL,
  `previousStatus` ENUM(
    'DRAFT',
    'SEDANG_DISUSUN',
    'MENUNGGU_PENGAJUAN_EVALUASI',
    'DIAJUKAN_EVALUASI',
    'SEDANG_DIEVALUASI',
    'REVISI_DARI_EVALUATOR',
    'DITOLAK_EVALUATOR',
    'MENUNGGU_TTD_PJ_EVALUATOR',
    'DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
    'BERLAKU',
    'DIGANTIKAN',
    'DICABUT'
  ) NOT NULL,
  `nextStatus` ENUM(
    'DRAFT',
    'SEDANG_DISUSUN',
    'MENUNGGU_PENGAJUAN_EVALUASI',
    'DIAJUKAN_EVALUASI',
    'SEDANG_DIEVALUASI',
    'REVISI_DARI_EVALUATOR',
    'DITOLAK_EVALUATOR',
    'MENUNGGU_TTD_PJ_EVALUATOR',
    'DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
    'BERLAKU',
    'DIGANTIKAN',
    'DICABUT'
  ) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`processReviewId`),
  INDEX `ProcessReview_detail_created_idx` (`detailSopId`, `createdAt`),
  INDEX `ProcessReview_process_created_idx` (`processId`, `createdAt`),
  INDEX `ProcessReview_reviewer_created_idx` (`reviewedById`, `createdAt`),
  CONSTRAINT `ProcessReview_detailSopId_fkey`
    FOREIGN KEY (`detailSopId`) REFERENCES `DetailSOP`(`detailSopId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReview_sopId_fkey`
    FOREIGN KEY (`sopId`) REFERENCES `SOP`(`sopId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReview_processId_fkey`
    FOREIGN KEY (`processId`) REFERENCES `Process`(`processId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProcessReview_reviewedById_fkey`
    FOREIGN KEY (`reviewedById`) REFERENCES `Pengguna`(`penggunaId`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
