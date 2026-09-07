-- Preserve the DokumenTte foreign-key support while the immutable FTI contraction
-- replaces the old composite signing index.
--
-- This migration intentionally sorts immediately before
-- 20260907100000_full_fti_persistence_contraction. It is safe on databases where
-- that contraction was already applied: the temporary index is added here and
-- removed by the following cleanup migration.

CREATE INDEX `RiwayatTandaTangan_dokumenTteId_fk_support_idx`
  ON `RiwayatTandaTangan`(`dokumenTteId`);
