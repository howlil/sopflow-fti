-- Full FTI persistence contraction.
-- Applied migration history remains immutable; this migration removes the old
-- organizational/evaluation model from the resulting database schema.

-- 1. Stop database behavior that still references retired organizational fields.
DROP TRIGGER IF EXISTS `trg_dokumentte_satu_parent_insert`;
DROP TRIGGER IF EXISTS `trg_dokumentte_satu_parent_update`;
DROP TRIGGER IF EXISTS `trg_detailsoppelaksana_pelaksana_opd_insert`;
DROP TRIGGER IF EXISTS `trg_detailsoppelaksana_pelaksana_opd_update`;
DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_opd_insert`;
DROP TRIGGER IF EXISTS `trg_langkahsop_pelaksana_opd_update`;
DROP TRIGGER IF EXISTS `trg_opd_kepala_pj_konsisten_insert`;
DROP TRIGGER IF EXISTS `trg_opd_kepala_pj_konsisten_update`;
DROP TRIGGER IF EXISTS `trg_pengguna_peran_slot_konsisten_update`;
DROP TRIGGER IF EXISTS `trg_pengguna_pindah_lepas_slot`;

-- 2. Expand persisted workflow enums so rows can be translated safely.
ALTER TABLE `DetailSOP`
  MODIFY `status` ENUM(
    'DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI','DIAJUKAN_EVALUASI',
    'SEDANG_DIEVALUASI','REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR',
    'MENUNGGU_TTD_PJ_EVALUATOR','DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
    'BERLAKU','DIGANTIKAN','DICABUT',
    'PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL','TTE_PENDING',
    'EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE `ProcessReview`
  MODIFY `previousStatus` ENUM(
    'DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI','DIAJUKAN_EVALUASI',
    'SEDANG_DIEVALUASI','REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR',
    'MENUNGGU_TTD_PJ_EVALUATOR','DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
    'BERLAKU','DIGANTIKAN','DICABUT',
    'PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL','TTE_PENDING',
    'EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL,
  MODIFY `nextStatus` ENUM(
    'DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI','DIAJUKAN_EVALUASI',
    'SEDANG_DIEVALUASI','REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR',
    'MENUNGGU_TTD_PJ_EVALUATOR','DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI',
    'BERLAKU','DIGANTIKAN','DICABUT',
    'PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL','TTE_PENDING',
    'EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL;

UPDATE `DetailSOP` d
LEFT JOIN `ProcessFinalApproval` a ON a.`detailSopId` = d.`detailSopId`
SET d.`status` = CASE
  WHEN d.`status` IN ('DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI') THEN 'DRAFT'
  WHEN d.`status` IN ('DIAJUKAN_EVALUASI','SEDANG_DIEVALUASI') THEN 'PROCESS_REVIEW'
  WHEN d.`status` IN ('REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR') THEN 'REVISION_REQUIRED'
  WHEN d.`status` = 'MENUNGGU_TTD_PJ_EVALUATOR' AND a.`detailSopId` IS NULL THEN 'FINAL_APPROVAL'
  WHEN d.`status` IN ('MENUNGGU_TTD_PJ_EVALUATOR','DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI') THEN 'TTE_PENDING'
  WHEN d.`status` = 'BERLAKU' THEN 'EFFECTIVE'
  WHEN d.`status` = 'DIGANTIKAN' THEN 'SUPERSEDED'
  WHEN d.`status` = 'DICABUT' THEN 'REVOKED'
  ELSE d.`status`
END;

UPDATE `ProcessReview`
SET `previousStatus` = CASE
      WHEN `previousStatus` IN ('DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI') THEN 'DRAFT'
      WHEN `previousStatus` IN ('DIAJUKAN_EVALUASI','SEDANG_DIEVALUASI') THEN 'PROCESS_REVIEW'
      WHEN `previousStatus` IN ('REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR') THEN 'REVISION_REQUIRED'
      WHEN `previousStatus` = 'MENUNGGU_TTD_PJ_EVALUATOR' THEN 'FINAL_APPROVAL'
      WHEN `previousStatus` = 'DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI' THEN 'TTE_PENDING'
      WHEN `previousStatus` = 'BERLAKU' THEN 'EFFECTIVE'
      WHEN `previousStatus` = 'DIGANTIKAN' THEN 'SUPERSEDED'
      WHEN `previousStatus` = 'DICABUT' THEN 'REVOKED'
      ELSE `previousStatus`
    END,
    `nextStatus` = CASE
      WHEN `nextStatus` IN ('DRAFT','SEDANG_DISUSUN','MENUNGGU_PENGAJUAN_EVALUASI') THEN 'DRAFT'
      WHEN `nextStatus` IN ('DIAJUKAN_EVALUASI','SEDANG_DIEVALUASI') THEN 'PROCESS_REVIEW'
      WHEN `nextStatus` IN ('REVISI_DARI_EVALUATOR','DITOLAK_EVALUATOR') THEN 'REVISION_REQUIRED'
      WHEN `nextStatus` = 'MENUNGGU_TTD_PJ_EVALUATOR' THEN 'FINAL_APPROVAL'
      WHEN `nextStatus` = 'DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI' THEN 'TTE_PENDING'
      WHEN `nextStatus` = 'BERLAKU' THEN 'EFFECTIVE'
      WHEN `nextStatus` = 'DIGANTIKAN' THEN 'SUPERSEDED'
      WHEN `nextStatus` = 'DICABUT' THEN 'REVOKED'
      ELSE `nextStatus`
    END;

ALTER TABLE `DetailSOP`
  MODIFY `status` ENUM(
    'DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL',
    'TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE `ProcessReview`
  MODIFY `previousStatus` ENUM(
    'DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL',
    'TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL,
  MODIFY `nextStatus` ENUM(
    'DRAFT','PROCESS_REVIEW','REVISION_REQUIRED','FINAL_APPROVAL',
    'TTE_PENDING','EFFECTIVE','SUPERSEDED','REVOKED'
  ) NOT NULL;

ALTER TABLE `LogEditSOP`
  MODIFY `bagian` ENUM('HEADER','LANGKAH','STATUS','UMPAN_BALIK','EVALUASI','REVIEW') NOT NULL DEFAULT 'HEADER';
UPDATE `LogEditSOP` SET `bagian` = 'REVIEW' WHERE `bagian` = 'EVALUASI';
ALTER TABLE `LogEditSOP`
  MODIFY `bagian` ENUM('HEADER','LANGKAH','STATUS','UMPAN_BALIK','REVIEW') NOT NULL DEFAULT 'HEADER';

-- 3. Convert signing evidence to contextual FTI authority and remove non-FTI documents.
UPDATE `DokumenTte` dt
JOIN `DetailSOP` d ON d.`detailSopId` = dt.`detailSopId`
JOIN `SOP` s ON s.`sopId` = d.`sopId`
SET dt.`processId` = s.`processId`
WHERE dt.`detailSopId` IS NOT NULL AND s.`processId` IS NOT NULL;

DELETE r FROM `RiwayatTandaTangan` r
JOIN `DokumenTte` d ON d.`dokumenTteId` = r.`dokumenTteId`
LEFT JOIN `ProcessFinalApproval` a ON a.`detailSopId` = d.`detailSopId`
WHERE d.`detailSopId` IS NULL
   OR d.`processId` IS NULL
   OR a.`detailSopId` IS NULL;

DELETE d FROM `DokumenTte` d
LEFT JOIN `ProcessFinalApproval` a ON a.`detailSopId` = d.`detailSopId`
WHERE d.`detailSopId` IS NULL
   OR d.`processId` IS NULL
   OR a.`detailSopId` IS NULL;

ALTER TABLE `RiwayatTandaTangan`
  ADD COLUMN `authority` ENUM('DEAN','HEAD_OF_DEPARTMENT') NULL AFTER `dokumenTteId`;
UPDATE `RiwayatTandaTangan` r
JOIN `DokumenTte` d ON d.`dokumenTteId` = r.`dokumenTteId`
JOIN `ProcessFinalApproval` a ON a.`detailSopId` = d.`detailSopId`
SET r.`authority` = a.`authority`;
DELETE FROM `RiwayatTandaTangan` WHERE `authority` IS NULL;
DROP INDEX `RiwayatTandaTangan_dokumenTteId_peran_key` ON `RiwayatTandaTangan`;
ALTER TABLE `RiwayatTandaTangan`
  DROP COLUMN `peran`,
  MODIFY `authority` ENUM('DEAN','HEAD_OF_DEPARTMENT') NOT NULL;
CREATE UNIQUE INDEX `RiwayatTandaTangan_dokumenTteId_authority_key`
  ON `RiwayatTandaTangan`(`dokumenTteId`, `authority`);

ALTER TABLE `DokumenTte` DROP FOREIGN KEY `DokumenTte_pengajuanEvaluasiId_fkey`;
DROP INDEX `DokumenTte_pengajuanEvaluasiId_key` ON `DokumenTte`;
ALTER TABLE `DokumenTte`
  DROP COLUMN `pengajuanEvaluasiId`,
  MODIFY `detailSopId` CHAR(36) NOT NULL,
  MODIFY `processId` CHAR(36) NOT NULL,
  MODIFY `jenisDokumen` ENUM('SOP_BERLAKU') NOT NULL DEFAULT 'SOP_BERLAKU';

-- 4. Remove retired organizational identity shadows from active entities.
ALTER TABLE `Pengguna` DROP FOREIGN KEY `Pengguna_opdId_fkey`;
ALTER TABLE `SOP` DROP FOREIGN KEY `SOP_opdId_fkey`;
ALTER TABLE `Pelaksana` DROP FOREIGN KEY `Pelaksana_opdId_fkey`;
DROP INDEX `Pengguna_opdId_peran_deletedAt_idx` ON `Pengguna`;
DROP INDEX `SOP_opdId_idx` ON `SOP`;
DROP INDEX `Pelaksana_opdId_idx` ON `Pelaksana`;
ALTER TABLE `Pengguna` DROP COLUMN `opdId`, DROP COLUMN `peran`;
ALTER TABLE `SOP` DROP COLUMN `opdId`;
ALTER TABLE `Pelaksana` DROP COLUMN `opdId`;

-- 5. Remove retired evidence/storage that belongs to the superseded product model.
DROP TABLE IF EXISTS `_retired_NilaiEvaluasi_20260906`;
DROP TABLE IF EXISTS `_retired_LogNilaiEvaluasi_20260906`;
DROP TABLE IF EXISTS `_retired_PengingatWhatsApp_20260906`;
DROP TABLE IF EXISTS `_retired_NotifikasiInApp_20260906`;
DROP TABLE IF EXISTS `_retired_ProcessSopBinding_20260906`;
DROP TABLE IF EXISTS `LegacySopRetention`;
DROP TABLE IF EXISTS `OPDPeraturan`;
DROP TABLE IF EXISTS `RiwayatOpdPengguna`;
DROP TABLE IF EXISTS `PengajuanEvaluasi`;
DROP TABLE IF EXISTS `OPD`;
