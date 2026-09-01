CREATE TABLE `NotifikasiInApp` (
  `pengajuanEvaluasiId` CHAR(36) NOT NULL,
  `penggunaId` CHAR(36) NOT NULL,
  `jenis` ENUM(
    'EVALUASI_SOP',
    'TTD_BA_PJ_EVALUATOR',
    'TTD_BA_PJ_PENYUSUN',
    'TTD_SOP_KEPALA_OPD'
  ) NOT NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`pengajuanEvaluasiId`, `penggunaId`, `jenis`),
  INDEX `NotifikasiInApp_pengguna_read_created_idx` (`penggunaId`, `readAt`, `createdAt`),
  CONSTRAINT `NotifikasiInApp_pengajuanEvaluasiId_fkey`
    FOREIGN KEY (`pengajuanEvaluasiId`) REFERENCES `PengajuanEvaluasi` (`pengajuanEvaluasiId`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `NotifikasiInApp_penggunaId_fkey`
    FOREIGN KEY (`penggunaId`) REFERENCES `Pengguna` (`penggunaId`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Pertahankan notifikasi aktif yang sudah ada saat migration dijalankan.
-- Histori yang sebelumnya sudah terhapus oleh reconciler memang tidak dapat direkonstruksi.
INSERT IGNORE INTO `NotifikasiInApp` (
  `pengajuanEvaluasiId`,
  `penggunaId`,
  `jenis`,
  `readAt`,
  `createdAt`
)
SELECT
  `pengajuanEvaluasiId`,
  `penggunaId`,
  `jenis`,
  `inAppReadAt`,
  `createdAt`
FROM `PengingatWhatsApp`;
